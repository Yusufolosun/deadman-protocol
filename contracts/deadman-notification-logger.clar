;; deadman-notification-logger
;; Centralized protocol event logging.
;; Provides a sequential event log for off-chain indexers.
;; Events are stored on-chain with IDs for queryability.

(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-AUTHORIZED (err u900))

(define-data-var next-event-id uint u1)
(define-data-var authorized-caller principal CONTRACT-OWNER)

(define-map events uint {
  event-type: (string-ascii 32),
  vault-id: uint,
  actor: principal,
  data: uint,
  block: uint
})

;; --- Authorization ---

(define-public (set-authorized-caller (caller principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (ok (var-set authorized-caller caller))))

(define-private (is-authorized)
  (or (is-eq contract-caller (var-get authorized-caller))
      (is-eq contract-caller CONTRACT-OWNER)))

;; --- Event Logging ---

;; Log a protocol event. Returns the assigned event ID.
(define-public (log-event
    (event-type (string-ascii 32))
    (vault-id uint)
    (actor principal)
    (data uint))
  (let ((event-id (var-get next-event-id)))
    (asserts! (is-authorized) ERR-NOT-AUTHORIZED)
    (map-set events event-id {
      event-type: event-type,
      vault-id: vault-id,
      actor: actor,
      data: data,
      block: block-height
    })
    (var-set next-event-id (+ event-id u1))
    (print { event: "protocol-event", event-id: event-id, event-type: event-type, vault-id: vault-id })
    (ok event-id)))

;; --- Read Functions ---

(define-read-only (get-event (event-id uint))
  (map-get? events event-id))

(define-read-only (get-next-event-id)
  (var-get next-event-id))
