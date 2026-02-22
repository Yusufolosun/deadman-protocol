;; delegation-registry
;; Stores beneficiary and co-signer designations for each vault.
;; Vault entries are keyed by vault-id (uint) set by vault-core.
;; This contract is write-accessible only by vault-core.

(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-AUTHORIZED (err u300))
(define-constant ERR-SELF-DELEGATION (err u301))
(define-constant ERR-TOO-MANY (err u302))
(define-constant ERR-NOT-FOUND (err u303))

;; Authorized caller -- set once at deploy time to vault-core principal.
;; Until vault-core is deployed, this is temporarily the deployer.
(define-data-var authorized-caller principal CONTRACT-OWNER)

;; Primary beneficiary per vault
(define-map vault-beneficiary uint principal)

;; Co-signer list per vault: maps (vault-id, index) -> principal
(define-map vault-cosigner { vault-id: uint, index: uint } principal)

;; Co-signer count per vault
(define-map vault-cosigner-count uint uint)

;; Approvals: maps (vault-id, cosigner) -> bool
(define-map cosigner-approved { vault-id: uint, cosigner: principal } bool)

;; Approval count per vault
(define-map approval-count uint uint)

;; --- Authorization ---

(define-public (set-authorized-caller (caller principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (ok (var-set authorized-caller caller))))

(define-private (is-authorized)
  (or (is-eq tx-sender (var-get authorized-caller))
      (is-eq tx-sender CONTRACT-OWNER)))

;; --- Write Functions (vault-core only) ---

(define-public (set-beneficiary (vault-id uint) (beneficiary principal) (owner principal))
  (begin
    (asserts! (is-authorized) ERR-NOT-AUTHORIZED)
    (asserts! (not (is-eq beneficiary owner)) ERR-SELF-DELEGATION)
    (ok (map-set vault-beneficiary vault-id beneficiary))))

(define-public (add-cosigner (vault-id uint) (cosigner principal) (owner principal) (max-allowed uint))
  (let ((current-count (default-to u0 (map-get? vault-cosigner-count vault-id))))
    (asserts! (is-authorized) ERR-NOT-AUTHORIZED)
    (asserts! (not (is-eq cosigner owner)) ERR-SELF-DELEGATION)
    (asserts! (< current-count max-allowed) ERR-TOO-MANY)
    (map-set vault-cosigner { vault-id: vault-id, index: current-count } cosigner)
    (ok (map-set vault-cosigner-count vault-id (+ current-count u1)))))

;; Co-signer submits approval
(define-public (submit-approval (vault-id uint))
  (let ((current (default-to u0 (map-get? approval-count vault-id))))
    (asserts! (not (default-to false (map-get? cosigner-approved { vault-id: vault-id, cosigner: tx-sender }))) ERR-NOT-AUTHORIZED)
    (map-set cosigner-approved { vault-id: vault-id, cosigner: tx-sender } true)
    (ok (map-set approval-count vault-id (+ current u1)))))

;; --- Read Functions ---

(define-read-only (get-beneficiary (vault-id uint))
  (map-get? vault-beneficiary vault-id))

(define-read-only (get-cosigner-count (vault-id uint))
  (default-to u0 (map-get? vault-cosigner-count vault-id)))

(define-read-only (get-approval-count (vault-id uint))
  (default-to u0 (map-get? approval-count vault-id)))

(define-read-only (has-approved (vault-id uint) (cosigner principal))
  (default-to false (map-get? cosigner-approved { vault-id: vault-id, cosigner: cosigner })))
