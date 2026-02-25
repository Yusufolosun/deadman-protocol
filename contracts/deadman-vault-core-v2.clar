;; deadman-vault-core-v2
;; Primary entry point for the Deadman Protocol (V2).
;; Users create vaults, configure conditions, deposit STX, and trigger releases here.
;; Orchestrates delegation, fee collection, and vault registration.
;; STX is held by this contract and released directly to beneficiaries.

(define-constant ERR-PAUSED (err u601))
(define-constant ERR-INVALID-CONDITION (err u602))
(define-constant ERR-VAULT-NOT-FOUND (err u603))
(define-constant ERR-NOT-VAULT-OWNER (err u604))
(define-constant ERR-NOT-ACTIVE (err u605))
(define-constant ERR-CONDITIONS-NOT-MET (err u606))
(define-constant ERR-LOCK-TOO-SHORT (err u607))
(define-constant ERR-ZERO-DEPOSIT (err u608))
(define-constant ERR-NO-BENEFICIARY (err u609))
(define-constant ERR-CANCEL-FAILED (err u610))
(define-constant ERR-TRANSFER-FAILED (err u611))

;; Vault status constants
(define-constant STATUS-ACTIVE u0)
(define-constant STATUS-RELEASED u1)
(define-constant STATUS-CANCELLED u2)

(define-data-var next-vault-id uint u1)

(define-map vaults uint {
  owner: principal,
  amount: uint,
  condition-type: uint,
  target-block: uint,
  inactivity-blocks: uint,
  required-threshold: uint,
  status: uint,
  created-at: uint
})

;; Index: owner -> vault-id at position
(define-map owner-vault-ids { owner: principal, index: uint } uint)
(define-map owner-vault-count principal uint)

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
    ;; Collect protocol fee (charged on top of deposit)
    (try! (contract-call? .deadman-fee-vault collect-fee amount))
    ;; Transfer deposit to vault-core
    (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))
    ;; Set beneficiary in delegation registry
    (try! (contract-call? .deadman-delegation-registry-v2 set-beneficiary vault-id beneficiary tx-sender))
    ;; Register vault in global registry
    (try! (contract-call? .deadman-vault-registry register-vault vault-id tx-sender beneficiary))
    ;; Auto-ping for inactivity vaults so the countdown starts from creation
    (if (is-eq condition-type u2)
        (begin (unwrap-panic (contract-call? .activity-tracker ping)) true)
        true)
    (map-set vaults vault-id {
      owner: tx-sender,
      amount: amount,
      condition-type: condition-type,
      target-block: target-block,
      inactivity-blocks: inactivity-blocks,
      required-threshold: required-threshold,
      status: STATUS-ACTIVE,
      created-at: block-height
    })
    (map-set owner-vault-ids { owner: tx-sender, index: (default-to u0 (map-get? owner-vault-count tx-sender)) } vault-id)
    (map-set owner-vault-count tx-sender (+ (default-to u0 (map-get? owner-vault-count tx-sender)) u1))
    (var-set next-vault-id (+ vault-id u1))
    (print { event: "vault-created", vault-id: vault-id, owner: tx-sender, amount: amount, condition-type: condition-type })
    (ok vault-id)))

;; --- Add Co-signer (owner only, active vaults) ---

(define-public (add-cosigner (vault-id uint) (cosigner principal))
  (let (
    (vault (unwrap! (map-get? vaults vault-id) ERR-VAULT-NOT-FOUND))
    (max-cosigners (get max-cosigners (contract-call? .admin-config get-config))))
    (asserts! (is-eq tx-sender (get owner vault)) ERR-NOT-VAULT-OWNER)
    (asserts! (is-eq (get status vault) STATUS-ACTIVE) ERR-NOT-ACTIVE)
    (contract-call? .deadman-delegation-registry-v2 add-cosigner vault-id cosigner tx-sender max-cosigners)))

;; --- Submit Co-signer Approval ---

(define-public (submit-approval (vault-id uint))
  (begin
    (asserts! (is-some (map-get? vaults vault-id)) ERR-VAULT-NOT-FOUND)
    (contract-call? .deadman-delegation-registry-v2 submit-approval vault-id)))

;; --- Trigger Release ---
;; Transfers STX directly from this contract to the beneficiary.

(define-public (trigger-release (vault-id uint))
  (let (
    (vault (unwrap! (map-get? vaults vault-id) ERR-VAULT-NOT-FOUND))
    (approval-count (contract-call? .deadman-delegation-registry-v2 get-approval-count vault-id))
    (condition-met (unwrap! (contract-call? .condition-engine evaluate-condition
        (get condition-type vault)
        (get owner vault)
        (get target-block vault)
        (get inactivity-blocks vault)
        approval-count
        (get required-threshold vault))
      ERR-INVALID-CONDITION))
    (beneficiary (unwrap! (contract-call? .deadman-delegation-registry-v2 get-beneficiary vault-id) ERR-NO-BENEFICIARY)))
    (asserts! (is-eq (get status vault) STATUS-ACTIVE) ERR-NOT-ACTIVE)
    (asserts! condition-met ERR-CONDITIONS-NOT-MET)
    (map-set vaults vault-id (merge vault { status: STATUS-RELEASED }))
    ;; Update vault registry
    (try! (contract-call? .deadman-vault-registry update-vault-status vault-id STATUS-RELEASED))
    (match (as-contract (stx-transfer? (get amount vault) tx-sender beneficiary))
      success (begin
        (print { event: "vault-released", vault-id: vault-id, beneficiary: beneficiary, amount: (get amount vault) })
        (ok true))
      error ERR-TRANSFER-FAILED)))

;; --- Cancel Vault (owner only, active vaults) ---

(define-public (cancel-vault (vault-id uint))
  (let ((vault (unwrap! (map-get? vaults vault-id) ERR-VAULT-NOT-FOUND)))
    (asserts! (is-eq tx-sender (get owner vault)) ERR-NOT-VAULT-OWNER)
    (asserts! (is-eq (get status vault) STATUS-ACTIVE) ERR-NOT-ACTIVE)
    (map-set vaults vault-id (merge vault { status: STATUS-CANCELLED }))
    ;; Update vault registry
    (try! (contract-call? .deadman-vault-registry update-vault-status vault-id STATUS-CANCELLED))
    (match (as-contract (stx-transfer? (get amount vault) tx-sender (get owner vault)))
      success (begin
        (print { event: "vault-cancelled", vault-id: vault-id, owner: (get owner vault) })
        (ok true))
      error ERR-CANCEL-FAILED)))

;; --- Read Functions ---

(define-read-only (get-vault (vault-id uint))
  (map-get? vaults vault-id))

(define-read-only (get-vault-status (vault-id uint))
  (get status (map-get? vaults vault-id)))

(define-read-only (get-next-vault-id)
  (var-get next-vault-id))

(define-read-only (get-owner-vault-count (owner principal))
  (default-to u0 (map-get? owner-vault-count owner)))

(define-read-only (get-owner-vault-id (owner principal) (index uint))
  (map-get? owner-vault-ids { owner: owner, index: index }))
