#!/bin/sh
# Create the live host's AWS resources (docs/deployment.md section 2; SR-14, SR-16, T-52, AR-5, AR-9).
# NOT run by CI. Read it first, then run it yourself with credentials for the target account:
#   EIP_ALLOC_ID=eipalloc-... sh scripts/aws-provision.sh
# Creates: security group (80/443 in), IAM role + instance profile (SSM + read one secret),
# one t3.medium instance (IMDSv2 required, encrypted disk, no key pair), then attaches the Elastic IP.
set -eu

: "${EIP_ALLOC_ID:?set EIP_ALLOC_ID to the Elastic IP allocation id}"
REGION="${AWS_REGION:-us-east-1}"
SECRET_ID="${SECRET_ID:-incident-app/dotenvx-key}"
NAME="${NAME:-incident-app}"
export AWS_DEFAULT_REGION="$REGION" AWS_PAGER=""

echo "Account: $(aws sts get-caller-identity --query Account --output text), region: $REGION"
printf 'Create resources named "%s" here? [y/N] ' "$NAME"
read -r ok
[ "$ok" = "y" ] || { echo "Aborted"; exit 1; }

# Default VPC and one of its public subnets; set VPC_ID and SUBNET_ID to use others.
VPC_ID="${VPC_ID:-$(aws ec2 describe-vpcs --filters Name=isDefault,Values=true --query 'Vpcs[0].VpcId' --output text)}"
[ "$VPC_ID" != "None" ] || { echo "No default VPC; set VPC_ID and SUBNET_ID"; exit 1; }
SUBNET_ID="${SUBNET_ID:-$(aws ec2 describe-subnets --filters Name=vpc-id,Values="$VPC_ID" Name=default-for-az,Values=true \
  --query 'Subnets[0].SubnetId' --output text)}"
[ "$SUBNET_ID" != "None" ] || { echo "No default subnet; set SUBNET_ID"; exit 1; }

# Security group: inbound 80 and 443 only (T-52). A new group has no inbound rules; outbound stays open for ACME and package installs.
SG_ID="$(aws ec2 create-security-group --group-name "$NAME" --description "Incident app: 80 and 443 only" \
  --vpc-id "$VPC_ID" --query GroupId --output text)"
aws ec2 authorize-security-group-ingress --group-id "$SG_ID" \
  --ip-permissions 'IpProtocol=tcp,FromPort=80,ToPort=80,IpRanges=[{CidrIp=0.0.0.0/0}]' \
                   'IpProtocol=tcp,FromPort=443,ToPort=443,IpRanges=[{CidrIp=0.0.0.0/0}]' >/dev/null

# IAM: SSM Session Manager access plus read of exactly one secret (AR-5).
SECRET_ARN="$(aws secretsmanager describe-secret --secret-id "$SECRET_ID" --query ARN --output text)"
aws iam create-role --role-name "$NAME" --assume-role-policy-document \
  '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"ec2.amazonaws.com"},"Action":"sts:AssumeRole"}]}' >/dev/null
aws iam attach-role-policy --role-name "$NAME" --policy-arn arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
aws iam put-role-policy --role-name "$NAME" --policy-name read-dotenvx-key --policy-document \
  "{\"Version\":\"2012-10-17\",\"Statement\":[{\"Effect\":\"Allow\",\"Action\":\"secretsmanager:GetSecretValue\",\"Resource\":\"$SECRET_ARN\"}]}"
aws iam create-instance-profile --instance-profile-name "$NAME" >/dev/null
aws iam add-role-to-instance-profile --instance-profile-name "$NAME" --role-name "$NAME"
sleep 15 # IAM changes need a moment before an instance can use the profile

AMI_ID="$(aws ssm get-parameter --name /aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64 \
  --query Parameter.Value --output text)"

# No --key-name: no SSH. IMDSv2 required, hop limit 1 so containers can't reach the instance role. Temporary public IP is replaced by the Elastic IP below.
# User data installs only Docker, git and make; Compose, Node and buildx are checked by hand (docs/deployment.md 2b).
INSTANCE_ID="$(aws ec2 run-instances --image-id "$AMI_ID" --instance-type t3.medium \
  --subnet-id "$SUBNET_ID" --security-group-ids "$SG_ID" --associate-public-ip-address \
  --iam-instance-profile Name="$NAME" \
  --metadata-options HttpTokens=required,HttpEndpoint=enabled,HttpPutResponseHopLimit=1 \
  --block-device-mappings 'DeviceName=/dev/xvda,Ebs={VolumeSize=30,VolumeType=gp3,Encrypted=true,DeleteOnTermination=true}' \
  --user-data '#!/bin/sh
dnf install -y docker git make
systemctl enable --now docker' \
  --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=$NAME}]" \
  --query 'Instances[0].InstanceId' --output text)"
aws ec2 wait instance-running --instance-ids "$INSTANCE_ID"
aws ec2 associate-address --instance-id "$INSTANCE_ID" --allocation-id "$EIP_ALLOC_ID" >/dev/null

echo "Instance $INSTANCE_ID, security group $SG_ID. Connect (needs the Session Manager plugin): aws ssm start-session --target $INSTANCE_ID"
echo "Teardown later: terminate the instance, delete the group, role and profile \"$NAME\", release $EIP_ALLOC_ID, delete $SECRET_ID."
