;; deadman-recovery
;; Recovery mechanisms for failed or stuck vault releases.
;; Vault owners or deployer can submit recovery requests.
;; Deployer resolves requests (approve or reject).

(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-AUTHORIZED (err u1400))
(define-constant ERR-NOT-FOUND (err u1401))
(define-constant ERR-ALREADY-EXISTS (err u1402))
(define-constant ERR-NOT-PENDING (err u1403))
(define-constant ERR-VAULT-NOT-FOUND (err u1404))
(define-constant ERR-INVALID-RESOLUTION (err u1405))

;; Recovery status: u0 = pending, u1 = resolved, u2 = rejected
(define-data-var next-recovery-id uint u1)

(define-map recovery-entries uint {
  vault-id: uint,
  requester: principal,
  reason: (string-ascii 64),
  status: uint,
  created-at: uint,
  resolved-at: uint
})

(define-map vault-recovery-id uint uint) ;; vault-id -> recovery-id

;; --- Submit Recovery Request ---

;; Only vault owner or deployer can request recovery for a vault.
(define-public (request-recovery (vault-id uint) (reason (string-ascii 64)))
  (let (
    (recovery-id (var-get next-recovery-id))
    (vault (unwrap! (contract-call? .deadman-vault-core-v2 get-vault vault-id) ERR-VAULT-NOT-FOUND)))
    (asserts! (is-none (map-get? vault-recovery-id vault-id)) ERR-ALREADY-EXISTS)
    (asserts! (or (is-eq tx-sender (get owner vault))
                  (is-eq tx-sender CONTRACT-OWNER)) ERR-NOT-AUTHORIZED)
    (map-set recovery-entries recovery-id {
      vault-id: vault-id,
      requester: tx-sender,
      reason: reason,
      status: u0,
      created-at: block-height,
      resolved-at: u0
    })
    (map-set vault-recovery-id vault-id recovery-id)
    (var-set next-recovery-id (+ recovery-id u1))
    (print { event: "recovery-requested", recovery-id: recovery-id, vault-id: vault-id })
    (ok recovery-id)))

;; --- Resolve Recovery (admin only) ---

;; resolution: u1 = resolved, u2 = rejected
(define-public (resolve-recovery (recovery-id uint) (resolution uint))
  (let ((entry (unwrap! (map-get? recovery-entries recovery-id) ERR-NOT-FOUND)))
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (asserts! (is-eq (get status entry) u0) ERR-NOT-PENDING)
    (asserts! (or (is-eq resolution u1) (is-eq resolution u2)) ERR-INVALID-RESOLUTION)
    (map-set recovery-entries recovery-id
      (merge entry { status: resolution, resolved-at: block-height }))
    ;; Clean up vault mapping on resolution
    (if (is-eq resolution u1)
        (map-delete vault-recovery-id (get vault-id entry))
        false)
    (print { event: "recovery-resolved", recovery-id: recovery-id, resolution: resolution })
    (ok true)))

;; --- Read Functions ---

(define-read-only (get-recovery (recovery-id uint))
  (map-get? recovery-entries recovery-id))

(define-read-only (get-vault-recovery (vault-id uint))
  (map-get? vault-recovery-id vault-id))

(define-read-only (get-next-recovery-id)
  (var-get next-recovery-id))
