;; deadman-vault-core
;; Primary entry point for the Deadman Protocol.
;; Users create vaults, configure conditions, deposit STX, and trigger releases here.
;; Orchestrates all other contracts.

(define-constant ERR-PAUSED (err u601))
(define-constant ERR-INVALID-CONDITION (err u602))
(define-constant ERR-VAULT-NOT-FOUND (err u603))
(define-constant ERR-NOT-VAULT-OWNER (err u604))
(define-constant ERR-ALREADY-RELEASED (err u605))
(define-constant ERR-CONDITIONS-NOT-MET (err u606))
(define-constant ERR-LOCK-TOO-SHORT (err u607))
(define-constant ERR-ZERO-DEPOSIT (err u608))
(define-constant ERR-CANCEL-FAILED (err u610))

(define-data-var next-vault-id uint u1)

(define-map vaults uint {
  owner: principal,
  amount: uint,
  condition-type: uint,
  target-block: uint,
  inactivity-blocks: uint,
  required-threshold: uint,
  released: bool,
  created-at: uint
})

;; --- Vault Creation ---

(define-public (create-vault
    (amount uint)
    (condition-type uint)
    (target-block uint)
    (inactivity-blocks uint)
    (required-threshold uint)
    (beneficiary principal))
  (let (
    (vault-id (var-get next-vault-id))
    (cfg (contract-call? .admin-config get-config))
    (min-lock (get min-lock-blocks cfg)))
    (asserts! (not (get paused cfg)) ERR-PAUSED)
    (asserts! (> amount u0) ERR-ZERO-DEPOSIT)
    (asserts! (and (>= condition-type u1) (<= condition-type u3)) ERR-INVALID-CONDITION)
    (asserts!
      (if (is-eq condition-type u1)
          (>= target-block (+ block-height min-lock))
          (if (is-eq condition-type u2)
              (>= inactivity-blocks min-lock)
              (> required-threshold u0)))
      ERR-LOCK-TOO-SHORT)
    (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))
    (try! (contract-call? .delegation-registry set-beneficiary vault-id beneficiary tx-sender))
    (map-set vaults vault-id {
      owner: tx-sender,
      amount: amount,
      condition-type: condition-type,
      target-block: target-block,
      inactivity-blocks: inactivity-blocks,
      required-threshold: required-threshold,
      released: false,
      created-at: block-height
    })
    (var-set next-vault-id (+ vault-id u1))
    (print { event: "vault-created", vault-id: vault-id, owner: tx-sender, amount: amount, condition-type: condition-type })
    (ok vault-id)))

;; --- Add Co-signer (owner only, before release) ---

(define-public (add-cosigner (vault-id uint) (cosigner principal))
  (let (
    (vault (unwrap! (map-get? vaults vault-id) ERR-VAULT-NOT-FOUND))
    (max-cosigners (get max-cosigners (contract-call? .admin-config get-config))))
    (asserts! (is-eq tx-sender (get owner vault)) ERR-NOT-VAULT-OWNER)
    (asserts! (not (get released vault)) ERR-ALREADY-RELEASED)
    (contract-call? .delegation-registry add-cosigner vault-id cosigner tx-sender max-cosigners)))

;; --- Submit Co-signer Approval ---

(define-public (submit-approval (vault-id uint))
  (begin
    (asserts! (is-some (map-get? vaults vault-id)) ERR-VAULT-NOT-FOUND)
    (contract-call? .delegation-registry submit-approval vault-id)))

;; --- Trigger Release ---

(define-public (trigger-release (vault-id uint))
  (let (
    (vault (unwrap! (map-get? vaults vault-id) ERR-VAULT-NOT-FOUND))
    (approval-count (contract-call? .delegation-registry get-approval-count vault-id))
    (condition-met (unwrap! (contract-call? .condition-engine evaluate-condition
        (get condition-type vault)
        (get owner vault)
        (get target-block vault)
        (get inactivity-blocks vault)
        approval-count
        (get required-threshold vault))
      ERR-INVALID-CONDITION)))
    (asserts! (not (get released vault)) ERR-ALREADY-RELEASED)
    (asserts! condition-met ERR-CONDITIONS-NOT-MET)
    (map-set vaults vault-id (merge vault { released: true }))
    (contract-call? .release-handler execute-release vault-id (get amount vault))))

;; --- Cancel Vault (owner only, before release) ---

(define-public (cancel-vault (vault-id uint))
  (let ((vault (unwrap! (map-get? vaults vault-id) ERR-VAULT-NOT-FOUND)))
    (asserts! (is-eq tx-sender (get owner vault)) ERR-NOT-VAULT-OWNER)
    (asserts! (not (get released vault)) ERR-ALREADY-RELEASED)
    (map-set vaults vault-id (merge vault { released: true }))
    (match (as-contract (stx-transfer? (get amount vault) tx-sender (get owner vault)))
      success (begin
        (print { event: "vault-cancelled", vault-id: vault-id, owner: (get owner vault) })
        (ok true))
      error ERR-CANCEL-FAILED)))

;; --- Read Functions ---

(define-read-only (get-vault (vault-id uint))
  (map-get? vaults vault-id))

(define-read-only (get-next-vault-id)
  (var-get next-vault-id))
