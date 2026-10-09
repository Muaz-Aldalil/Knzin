# Security Policy

ui-review-loop runs inside arbitrary project repositories and treats them as untrusted input: package reads are containment-checked, symlinks are refused where they would escape the evidence directory, and the review server binds to loopback only.

## Reporting a vulnerability

Please report vulnerabilities privately through GitHub's private vulnerability reporting ("Report a vulnerability" on the repository's Security tab). Do not open a public issue for a security problem.

## Supported versions

Only the latest `main` is supported.
