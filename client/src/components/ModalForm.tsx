// src/components/ModalForm.tsx
import { Modal, Button } from 'react-bootstrap'
import { ReactNode } from 'react'

export default function ModalForm({
  title, show, onHide, footer, children, size = 'lg'
}: {
  title: string
  show: boolean
  onHide: () => void
  size?: 'sm'|'lg'|'xl'
  footer?: ReactNode
  children: ReactNode
}) {
  return (
    <Modal show={show} onHide={onHide} centered size={size}>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>{children}</Modal.Body>
      {footer && <Modal.Footer>{footer}</Modal.Footer>}
    </Modal>
  )
}
