;; deadman-vault-registry
;; Global vault index for tracking and querying vaults across the protocol.
;; Maintains counts by status and provides beneficiary reverse lookups.

(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-AUTHORIZED (err u800))
(define-constant ERR-ALREADY-REGISTERED (err u801))
(define-constant ERR-NOT-FOUND (err u802))
(define-constant ERR-INVALID-STATUS (err u803))

(define-data-var authorized-caller principal CONTRACT-OWNER)
(define-data-var total-vaults uint u0)

;; Vault registration data
(define-map registered-vaults uint {
  owner: principal,
  status: uint,
  registered-at: uint
})

;; Counts by status (u0 = active, u1 = released, u2 = cancelled)
(define-map status-count uint uint)

;; Beneficiary reverse index
(define-map beneficiary-vault-ids { beneficiary: principal, index: uint } uint)
(define-map beneficiary-vault-count principal uint)

;; --- Authorization ---

(define-public (set-authorized-caller (caller principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (ok (var-set authorized-caller caller))))

(define-private (is-authorized)
  (or (is-eq contract-caller (var-get authorized-caller))
      (is-eq contract-caller CONTRACT-OWNER)))

;; --- Write Functions ---

;; Register a new vault in the global index
(define-public (register-vault (vault-id uint) (owner principal) (beneficiary principal))
  (begin
    (asserts! (is-authorized) ERR-NOT-AUTHORIZED)
    (asserts! (is-none (map-get? registered-vaults vault-id)) ERR-ALREADY-REGISTERED)
    (map-set registered-vaults vault-id {
      owner: owner,
      status: u0,
      registered-at: block-height
    })
    ;; Increment active count
    (map-set status-count u0 (+ (default-to u0 (map-get? status-count u0)) u1))
    ;; Update beneficiary reverse index
    (let ((ben-count (default-to u0 (map-get? beneficiary-vault-count beneficiary))))
      (map-set beneficiary-vault-ids { beneficiary: beneficiary, index: ben-count } vault-id)
      (map-set beneficiary-vault-count beneficiary (+ ben-count u1)))
    (var-set total-vaults (+ (var-get total-vaults) u1))
    (ok true)))

;; Update vault status (called on release or cancel)
(define-public (update-vault-status (vault-id uint) (new-status uint))
  (let ((entry (unwrap! (map-get? registered-vaults vault-id) ERR-NOT-FOUND)))
    (asserts! (is-authorized) ERR-NOT-AUTHORIZED)
    (asserts! (and (>= new-status u0) (<= new-status u2)) ERR-INVALID-STATUS)
    ;; Decrement old status count
    (map-set status-count (get status entry)
      (- (default-to u1 (map-get? status-count (get status entry))) u1))
    ;; Increment new status count
    (map-set status-count new-status
      (+ (default-to u0 (map-get? status-count new-status)) u1))
    (map-set registered-vaults vault-id (merge entry { status: new-status }))
    (ok true)))

;; --- Read Functions ---

(define-read-only (get-vault-entry (vault-id uint))
  (map-get? registered-vaults vault-id))

(define-read-only (get-total-vaults)
  (var-get total-vaults))

(define-read-only (get-status-count (status uint))
  (default-to u0 (map-get? status-count status)))

(define-read-only (get-beneficiary-vault-count (beneficiary principal))
  (default-to u0 (map-get? beneficiary-vault-count beneficiary)))

(define-read-only (get-beneficiary-vault-id (beneficiary principal) (index uint))
  (map-get? beneficiary-vault-ids { beneficiary: beneficiary, index: index }))
