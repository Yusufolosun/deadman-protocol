;; deadman-access-control
;; Role-based access control for the Deadman Protocol.
;; Deployer assigns and revokes roles. Other contracts query roles.

(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-AUTHORIZED (err u1200))
(define-constant ERR-INVALID-ROLE (err u1201))
(define-constant ERR-SELF-REVOKE (err u1202))

;; Role constants
(define-constant ROLE-ADMIN u1)
(define-constant ROLE-OPERATOR u2)
(define-constant ROLE-GUARDIAN u3)

(define-map roles { account: principal, role: uint } bool)

;; Assign a role to a principal
(define-public (grant-role (account principal) (role uint))
  (begin
    (asserts! (or (is-eq tx-sender CONTRACT-OWNER)
                  (has-role tx-sender ROLE-ADMIN)) ERR-NOT-AUTHORIZED)
    (asserts! (and (>= role u1) (<= role u3)) ERR-INVALID-ROLE)
    (print { event: "role-granted", account: account, role: role })
    (ok (map-set roles { account: account, role: role } true))))

;; Revoke a role from a principal
(define-public (revoke-role (account principal) (role uint))
  (begin
    (asserts! (or (is-eq tx-sender CONTRACT-OWNER)
                  (has-role tx-sender ROLE-ADMIN)) ERR-NOT-AUTHORIZED)
    (asserts! (and (>= role u1) (<= role u3)) ERR-INVALID-ROLE)
    ;; Deployer cannot revoke their own admin role
    (asserts! (not (and (is-eq account CONTRACT-OWNER) (is-eq role ROLE-ADMIN))) ERR-SELF-REVOKE)
    (print { event: "role-revoked", account: account, role: role })
    (ok (map-delete roles { account: account, role: role }))))

;; Check if a principal has a specific role
(define-read-only (has-role (account principal) (role uint))
  (or (is-eq account CONTRACT-OWNER)
      (default-to false (map-get? roles { account: account, role: role }))))

;; Convenience: check specific roles
(define-read-only (is-admin (account principal))
  (has-role account ROLE-ADMIN))

(define-read-only (is-operator (account principal))
  (has-role account ROLE-OPERATOR))

(define-read-only (is-guardian (account principal))
  (has-role account ROLE-GUARDIAN))
