#!/bin/sh
set -eu
cd "$(dirname "$0")/../.."
# Fifty real source IPs on the disposable generator, not spoofed forwarding headers.
# Per-IP login defenses remain enabled; source addresses are chosen from the isolated network.
SUBNET=$(docker network inspect team13-slice7_public --format '{{(index .IPAM.Config 0).Subnet}}')
PREFIX=$(printf '%s' "$SUBNET" | cut -d. -f1-2)
docker run --rm --user 0:0 --cap-add NET_ADMIN --network team13-slice7_public \
 -e LOAD_PREFIX="$PREFIX" -v "$PWD/scripts/verification:/scripts:ro" -v /tmp/team13-slice7:/evidence \
 --entrypoint sh grafana/k6@sha256:3656673de3f30424e8ebcfa46acd9558d83b6a43612d0f668ffeac953950c6c7 -c '
 for n in $(seq 100 149); do ip addr add "$LOAD_PREFIX.200.$n/16" dev eth0; done
 exec k6 run --local-ips "$LOAD_PREFIX.200.100-$LOAD_PREFIX.200.149" /scripts/load.js'
