;; delegation-registry
;; Stores beneficiary and co-signer designations for each vault.
;; Vault entries are keyed by vault-id (uint) set by deadman-vault-core.

(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-AUTHORIZED (err u300))
(define-constant ERR-SELF-DELEGATION (err u301))
(define-constant ERR-TOO-MANY (err u302))
(define-constant ERR-ALREADY-APPROVED (err u304))
(define-constant ERR-NOT-COSIGNER (err u305))
(define-constant ERR-ALREADY-COSIGNER (err u306))

(define-data-var authorized-caller principal CONTRACT-OWNER)

(define-map vault-beneficiary uint principal)
(define-map vault-cosigner { vault-id: uint, index: uint } principal)
(define-map vault-cosigner-count uint uint)
(define-map cosigner-approved { vault-id: uint, cosigner: principal } bool)
(define-map approval-count uint uint)

;; --- Authorization ---

(define-public (set-authorized-caller (caller principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (ok (var-set authorized-caller caller))))

(define-private (is-authorized)
  (or (is-eq contract-caller (var-get authorized-caller))
      (is-eq contract-caller CONTRACT-OWNER)))

;; --- Co-signer Membership Check ---

;; Checks whether a principal is registered as a co-signer for a vault.
;; Iterates up to max 10 slots (matches admin-config max-cosigners limit).
(define-read-only (is-cosigner (vault-id uint) (who principal))
  (or
    (is-eq (some who) (map-get? vault-cosigner { vault-id: vault-id, index: u0 }))
    (is-eq (some who) (map-get? vault-cosigner { vault-id: vault-id, index: u1 }))
    (is-eq (some who) (map-get? vault-cosigner { vault-id: vault-id, index: u2 }))
    (is-eq (some who) (map-get? vault-cosigner { vault-id: vault-id, index: u3 }))
    (is-eq (some who) (map-get? vault-cosigner { vault-id: vault-id, index: u4 }))
    (is-eq (some who) (map-get? vault-cosigner { vault-id: vault-id, index: u5 }))
    (is-eq (some who) (map-get? vault-cosigner { vault-id: vault-id, index: u6 }))
    (is-eq (some who) (map-get? vault-cosigner { vault-id: vault-id, index: u7 }))
    (is-eq (some who) (map-get? vault-cosigner { vault-id: vault-id, index: u8 }))
    (is-eq (some who) (map-get? vault-cosigner { vault-id: vault-id, index: u9 }))))

;; --- Write Functions ---

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
    (asserts! (not (is-cosigner vault-id cosigner)) ERR-ALREADY-COSIGNER)
    (map-set vault-cosigner { vault-id: vault-id, index: current-count } cosigner)
    (ok (map-set vault-cosigner-count vault-id (+ current-count u1)))))

;; Co-signer submits approval -- caller must be a registered co-signer
(define-public (submit-approval (vault-id uint))
  (begin
    (asserts! (is-cosigner vault-id tx-sender) ERR-NOT-COSIGNER)
    (asserts! (not (default-to false (map-get? cosigner-approved { vault-id: vault-id, cosigner: tx-sender }))) ERR-ALREADY-APPROVED)
    (map-set cosigner-approved { vault-id: vault-id, cosigner: tx-sender } true)
    (ok (map-set approval-count vault-id (+ (default-to u0 (map-get? approval-count vault-id)) u1)))))

;; --- Read Functions ---

(define-read-only (get-beneficiary (vault-id uint))
  (map-get? vault-beneficiary vault-id))

(define-read-only (get-cosigner (vault-id uint) (index uint))
  (map-get? vault-cosigner { vault-id: vault-id, index: index }))

(define-read-only (get-cosigner-count (vault-id uint))
  (default-to u0 (map-get? vault-cosigner-count vault-id)))

(define-read-only (get-approval-count (vault-id uint))
  (default-to u0 (map-get? approval-count vault-id)))

(define-read-only (has-approved (vault-id uint) (cosigner principal))
  (default-to false (map-get? cosigner-approved { vault-id: vault-id, cosigner: cosigner })))
