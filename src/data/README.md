# Common-password list

`common-passwords.txt` is the SecLists `Passwords/Common-Credentials/Pwdb_top-1000000.txt` list (MIT license),
filtered to the accepted password length (15 to 128 characters), lowercased, de-duplicated, with `$HEX[...]` and
test entries removed. Passwords are compared offline (SR-2, ASVS V6.2.4, V6.2.12; assumption A-8: no outbound calls).
`tests/auth/password.test.ts` checks the SHA-256 in `common-passwords.txt.sha256`. Refresh per release (design §6).
