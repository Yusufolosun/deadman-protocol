;; deadman-fee-vault
;; Collects protocol fees on vault creation.
;; Fee rate is configurable by deployer (in basis points).
;; Accumulated fees can be withdrawn by the deployer.

(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-AUTHORIZED (err u700))
(define-constant ERR-INVALID-RATE (err u701))
(define-constant ERR-NOTHING-TO-WITHDRAW (err u702))
(define-constant ERR-TRANSFER-FAILED (err u703))

;; Fee rate in basis points (100 = 1%)
(define-data-var fee-rate-bps uint u50) ;; 0.5% default
(define-data-var total-collected uint u0)
(define-data-var authorized-caller principal CONTRACT-OWNER)

;; --- Authorization ---

(define-public (set-authorized-caller (caller principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (ok (var-set authorized-caller caller))))

(define-private (is-authorized)
  (or (is-eq contract-caller (var-get authorized-caller))
      (is-eq contract-caller CONTRACT-OWNER)))

;; --- Configuration ---

(define-public (set-fee-rate (rate uint))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (asserts! (<= rate u1000) ERR-INVALID-RATE) ;; max 10%
    (ok (var-set fee-rate-bps rate))))

;; --- Fee Collection ---

;; Collects fee from tx-sender based on vault amount.
;; Called by deadman-vault-core-v2 during create-vault.
;; Returns the fee amount collected.
(define-public (collect-fee (vault-amount uint))
  (let ((fee (/ (* vault-amount (var-get fee-rate-bps)) u10000)))
    (asserts! (is-authorized) ERR-NOT-AUTHORIZED)
    (if (> fee u0)
      (begin
        (try! (stx-transfer? fee tx-sender (as-contract tx-sender)))
        (var-set total-collected (+ (var-get total-collected) fee))
        (print { event: "fee-collected", amount: fee, payer: tx-sender })
        (ok fee))
      (ok u0))))

;; --- Fee Withdrawal ---

;; Withdraws accumulated fees to deployer
(define-public (withdraw-fees)
  (let ((balance (var-get total-collected)))
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (asserts! (> balance u0) ERR-NOTHING-TO-WITHDRAW)
    (var-set total-collected u0)
    (match (as-contract (stx-transfer? balance tx-sender CONTRACT-OWNER))
      success (begin
        (print { event: "fees-withdrawn", amount: balance, recipient: CONTRACT-OWNER })
        (ok balance))
      error ERR-TRANSFER-FAILED)))

;; --- Read Functions ---

(define-read-only (get-fee-rate)
  (var-get fee-rate-bps))

(define-read-only (get-total-collected)
  (var-get total-collected))

(define-read-only (calculate-fee (vault-amount uint))
  (/ (* vault-amount (var-get fee-rate-bps)) u10000))
