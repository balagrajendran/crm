// src/pages/Contacts.tsx
import { useState } from 'react'
import { Button, Card, Col, Form, Row, Table } from 'react-bootstrap'
import {
  useGetContactsQuery, useCreateContactMutation, useUpdateContactMutation,
  useDeleteContactMutation, Contact, api
} from '../../services/api'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import ModalForm from '../../components/ModalForm'
import { can, Role } from '../../utils/rbac'
import { useAppDispatch } from '../../app/hooks'

const schema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  CompanyId: z.preprocess(v => v === '' ? undefined : Number(v), z.number().optional())
})
type FormValues = z.infer<typeof schema>

export default function Contacts(){
  const [search,setSearch] = useState(''); const [page,setPage] = useState(1); const limit=10
  const { data, refetch } = useGetContactsQuery({ page, limit, search })
  const [createIt] = useCreateContactMutation()
  const [updateIt] = useUpdateContactMutation()
  const [deleteIt] = useDeleteContactMutation()
  const d = useAppDispatch()
  const user = JSON.parse(localStorage.getItem('user')||'null') as any
  const role = (user?.role || 'viewer') as Role

  const [show,setShow] = useState(false); const [editing,setEditing]=useState<Contact|null>(null)
  const { register, handleSubmit, reset, formState:{ errors, isSubmitting } } = useForm<FormValues>({ resolver:zodResolver(schema) })

  function openAdd(){ setEditing(null); reset({ firstName:'', lastName:'', email:'', phone:'', CompanyId: undefined }); setShow(true) }
  function openEdit(it:Contact){ setEditing(it); reset({ firstName:it.firstName||'', lastName:it.lastName||'', email:it.email||'', phone:it.phone||'', CompanyId: it.CompanyId }) ; setShow(true) }
  function close(){ setShow(false) }

  async function onSubmit(v:FormValues){
    if (editing) {
      const patch = d(api.util.updateQueryData('getContacts',{page,limit,search},(draft:any)=>{ const i=draft.data.findIndex((x:Contact)=>x.id===editing.id); if(i>-1) draft.data[i]={...draft.data[i],...v} }))
      try { await updateIt({ id: editing.id, ...v }).unwrap() } catch { patch.undo() }
    } else {
      const tempId = Math.floor(Math.random()*-1e9)
      const patch = d(api.util.updateQueryData('getContacts',{page,limit,search},(draft:any)=>{ draft.data.unshift({ id: tempId, ...v }) }))
      try { await createIt(v as any).unwrap() } catch { patch.undo() }
    }
    close(); refetch()
  }
  async function del(id:number){ const patch=d(api.util.updateQueryData('getContacts',{page,limit,search},(draft:any)=>{ draft.data=draft.data.filter((x:Contact)=>x.id!==id) })); try{ await deleteIt(id).unwrap() }catch{ patch.undo() }; refetch() }

  const items = data?.data ?? []; const total = data?.total ?? 0;

  return (
    <Row className="g-3">
      <Col md={12}>
        <Card><Card.Body className="d-flex gap-2">
          <Form.Control placeholder="Search..." value={search} onChange={(e)=>setSearch(e.target.value)} style={{maxWidth:320}}/>
          <Button onClick={()=>setPage(1)}>Search</Button>
          {can(role,'create','contacts') && <Button variant="success" onClick={openAdd}>Add Contact</Button>}
        </Card.Body></Card>
      </Col>

      <Col md={12}>
        <Card><Card.Body>
          <Card.Title>Contacts</Card.Title>
          <Table hover responsive size="sm">
            <thead><tr><th>ID</th><th>First</th><th>Last</th><th>Email</th><th>Phone</th><th>CompanyId</th><th>Actions</th></tr></thead>
            <tbody>{items.map((it:Contact)=>(
              <tr key={it.id}>
                <td>{it.id}</td><td>{it.firstName}</td><td>{it.lastName}</td><td>{it.email}</td><td>{it.phone}</td><td>{it.CompanyId}</td>
                <td className="d-flex gap-2">
                  {can(role,'update','contacts') && <Button size="sm" variant="outline-primary" onClick={()=>openEdit(it)}>Edit</Button>}
                  {can(role,'delete','contacts') && <Button size="sm" variant="danger" onClick={()=>del(it.id)}>Delete</Button>}
                </td>
              </tr>
            ))}</tbody>
          </Table>

          <div className="d-flex justify-content-between">
            <div>Page {page} of {Math.max(1, Math.ceil(total/limit))}</div>
            <div className="d-flex gap-2">
              <Button size="sm" disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Prev</Button>
              <Button size="sm" disabled={page>=Math.ceil(total/limit)} onClick={()=>setPage(p=>p+1)}>Next</Button>
            </div>
          </div>
        </Card.Body></Card>
      </Col>

      <ModalForm
        title={editing ? 'Edit Contact' : 'Add Contact'}
        show={show}
        onHide={()=>setShow(false)}
        footer={
          <>
            <Button variant="secondary" onClick={close}>Cancel</Button>
            <Button form="contact-form" type="submit" disabled={isSubmitting}>{editing?'Update':'Create'}</Button>
          </>
        }
      >
        <Form id="contact-form" onSubmit={handleSubmit(onSubmit)} className="d-grid gap-3">
          <Row className="g-3">
            <Col md={6}><Form.Group><Form.Label>First name</Form.Label><Form.Control {...register('firstName')} isInvalid={!!errors.firstName}/><Form.Control.Feedback type="invalid">{errors.firstName?.message}</Form.Control.Feedback></Form.Group></Col>
            <Col md={6}><Form.Group><Form.Label>Last name</Form.Label><Form.Control {...register('lastName')}/></Form.Group></Col>
          </Row>
          <Row className="g-3">
            <Col md={6}><Form.Group><Form.Label>Email</Form.Label><Form.Control {...register('email')} isInvalid={!!errors.email}/><Form.Control.Feedback type="invalid">{errors.email?.message}</Form.Control.Feedback></Form.Group></Col>
            <Col md={6}><Form.Group><Form.Label>Phone</Form.Label><Form.Control {...register('phone')}/></Form.Group></Col>
          </Row>
          <Form.Group><Form.Label>CompanyId</Form.Label><Form.Control {...register('CompanyId')} placeholder="Optional numeric CompanyId"/></Form.Group>
        </Form>
      </ModalForm>
    </Row>
  )
}
