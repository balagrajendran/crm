// src/pages/PurchaseOrder/ReceivePO.tsx
import { useEffect } from 'react'
import { Modal, Button, Table, Form, Row, Col, Alert } from 'react-bootstrap'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCreateGRNMutation } from '../services/api'

const lineSchema = z.object({
  PurchaseOrderItemId: z.number(),
  ordered: z.number(),
  alreadyReceived: z.number(),
  remaining: z.number(),
  receiveQty: z.coerce.number().min(0),
  acceptedQty: z.coerce.number().min(0),
  rejectedQty: z.coerce.number().min(0),
})
.refine((v) => v.acceptedQty + v.rejectedQty === v.receiveQty, {
  message: 'Accepted + Rejected must equal Receive Now',
  path: ['acceptedQty'],
})
.refine((v) => v.acceptedQty <= v.remaining, {
  message: 'Accepted exceeds remaining',
  path: ['acceptedQty'],
})

const formSchema = z.object({
  receivedDate: z.string().optional(),
  items: z.array(lineSchema).min(1),
})

type FormValues = z.infer<typeof formSchema>

export default function ReceivePO({
  show, onHide, po
}: { show:boolean; onHide:()=>void; po:any }) {
  const [createGRN, { isLoading }] = useCreateGRNMutation()

  const { control, handleSubmit, reset, watch, setValue, formState:{errors} } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { items: [] }
  })
  const { fields, replace } = useFieldArray({ control, name:'items' })

  useEffect(() => {
    if (!po) return
    // Build default lines from PO items
    const rows = (po.items || []).map((it:any) => {
      const ordered = Number(it.qtyOrdered ?? it.qty ?? 0)
      const already = Number(it.qtyReceived ?? 0)
      const remaining = Math.max(0, ordered - already)
      const receiveNow = remaining // default: receive all remaining
      const accepted = receiveNow    // default: all accepted
      return {
        PurchaseOrderItemId: it.id,
        ordered, alreadyReceived: already, remaining,
        receiveQty: receiveNow,
        acceptedQty: accepted,
        rejectedQty: 0,
      }
    }).filter((r:any) => r.remaining > 0)
    replace(rows)
    setValue('receivedDate', new Date().toISOString().slice(0,10))
  }, [po, replace, setValue])

  const onSubmit = async (v:FormValues) => {
    const payload = {
      PurchaseOrderId: po.id,
      receivedDate: v.receivedDate,
      items: v.items
    }
    await createGRN(payload).unwrap()
    onHide()
  }

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton><Modal.Title>Receive PO #{po?.number}</Modal.Title></Modal.Header>
      <Modal.Body>
        <Row className="mb-3">
          <Col md={4}>
            <Form.Group>
              <Form.Label>Received Date</Form.Label>
              <Controller control={control} name="receivedDate"
                render={({ field }) => <Form.Control type="date" {...field} />} />
            </Form.Group>
          </Col>
        </Row>

        {errors.items?.root?.message && <Alert variant="danger">{errors.items.root.message as any}</Alert>}

        <Table bordered hover size="sm" className="align-middle">
          <thead className="table-light">
            <tr>
              <th>Product</th>
              <th className="text-end">Ordered</th>
              <th className="text-end">Received</th>
              <th className="text-end">Remaining</th>
              <th className="text-end">Receive Now</th>
              <th className="text-end">Accepted</th>
              <th className="text-end">Rejected</th>
            </tr>
          </thead>
          <tbody>
            {fields.map((f, idx) => {
              const err = errors.items?.[idx]
              return (
                <tr key={f.id}>
                  <td>{po.items?.find((x:any)=>x.id===f.PurchaseOrderItemId)?.description || po.items?.find((x:any)=>x.id===f.PurchaseOrderItemId)?.product || '-'}</td>
                  <td className="text-end">{f.ordered}</td>
                  <td className="text-end">{f.alreadyReceived}</td>
                  <td className="text-end">{f.remaining}</td>
                  <td className="text-end">
                    <Controller name={`items.${idx}.receiveQty`} control={control}
                      render={({ field }) => <Form.Control type="number" min={0} {...field} />} />
                  </td>
                  <td className="text-end">
                    <Controller name={`items.${idx}.acceptedQty`} control={control}
                      render={({ field }) =>
                        <Form.Control type="number" min={0} isInvalid={!!err?.acceptedQty} {...field} />} />
                    <Form.Control.Feedback type="invalid">
                      {err?.acceptedQty?.message as any}
                    </Form.Control.Feedback>
                  </td>
                  <td className="text-end">
                    <Controller name={`items.${idx}.rejectedQty`} control={control}
                      render={({ field }) => <Form.Control type="number" min={0} {...field} />} />
                  </td>
                </tr>
              )
            })}
            {fields.length === 0 && (
              <tr><td colSpan={7} className="text-center text-muted py-3">Nothing remaining to receive</td></tr>
            )}
          </tbody>
        </Table>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Cancel</Button>
        <Button onClick={handleSubmit(onSubmit)} disabled={isLoading || fields.length===0}>Create GRN</Button>
      </Modal.Footer>
    </Modal>
  )
}
