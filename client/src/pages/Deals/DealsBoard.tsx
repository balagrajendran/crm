import { Card, Col, Row } from 'react-bootstrap'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { useEffect, useMemo, useState } from 'react'
import { useGetDealsQuery, useUpdateDealMutation, Deal } from '../../services/api'

const STAGES: Deal['stage'][] = ['new','qualified','proposal','won','lost']
type Columns = Record<Deal['stage'], Deal[]>

export default function DealsBoard(){
  const args = { page: 1, limit: 100, search: '' }
  const { data, refetch } = useGetDealsQuery(args)
  const [updateDeal] = useUpdateDealMutation()

  const initialCols = useMemo<Columns>(() => {
    const cols: Columns = { new: [], qualified: [], proposal: [], won: [], lost: [] }
    ;(data?.data || []).forEach(d => cols[d.stage].push(d))
    return cols
  }, [data])

  const [cols, setCols] = useState<Columns>(initialCols)
  useEffect(() => setCols(initialCols), [initialCols])

  async function onDragEnd(result: DropResult){
    const { source, destination, draggableId } = result
    if (!destination) return
    const from = source.droppableId as Deal['stage']
    const to   = destination.droppableId as Deal['stage']
    if (from === to && source.index === destination.index) return

    const dealId = parseInt(draggableId, 10)

    // optimistic move
    setCols(prev => {
      const next: Columns = {
        new:[...prev.new], qualified:[...prev.qualified],
        proposal:[...prev.proposal], won:[...prev.won], lost:[...prev.lost]
      }
      const [moved] = next[from].splice(source.index, 1)
      next[to].splice(destination.index, 0, { ...moved, stage: to })
      return next
    })

    try { await updateDeal({ id: dealId, stage: to }).unwrap() }
    catch { refetch() } // rollback if API fails
  }

  return (
    <Row className="g-3">
      <DragDropContext onDragEnd={onDragEnd}>
        {STAGES.map(stage => (
          <Col key={`col-${stage}`} md={6} lg={4} xl={2}>
            <Droppable droppableId={stage}>
              {(provided) => (
                // IMPORTANT: use a plain div for droppable registration
                <div ref={provided.innerRef} {...provided.droppableProps}>
                  <Card>
                    <Card.Body>
                      <Card.Title className="text-capitalize">{stage}</Card.Title>
                      <div className="d-flex flex-column gap-2">
                        {cols[stage].map((d, idx) => (
                          <Draggable draggableId={String(d.id)} index={idx} key={d.id}>
                            {(prov) => (
                              // IMPORTANT: plain div for draggable root
                              <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps}>
                                <Card className="border">
                                  <Card.Body className="p-2">
                                    <div className="fw-semibold">{d.title}</div>
                                    <div className="text-muted small">₹{d.amount?.toLocaleString()}</div>
                                  </Card.Body>
                                </Card>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    </Card.Body>
                  </Card>
                </div>
              )}
            </Droppable>
          </Col>
        ))}
      </DragDropContext>
    </Row>
  )
}
