import { Card, Col, Row } from 'react-bootstrap'
import { useDashboardQuery, useGetDealsQuery, useGetActivitiesQuery } from '../services/api'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, LineChart, Line, Legend, Cell
} from 'recharts'
import { useMemo } from 'react'

const COLORS = ['#0d6efd','#20c997','#ffc107','#6f42c1','#dc3545']

export default function Dashboard(){
  const { data: summary } = useDashboardQuery()
  const { data: dealsData } = useGetDealsQuery({ page:1, limit:1000, search:'' })
  const { data: actsData } = useGetActivitiesQuery({ page:1, limit:1000, search:'' })

  const deals = dealsData?.data || []
  const acts = actsData?.data || []

  // total value by stage
  const byStage = useMemo(() => {
    const map: Record<string, number> = {}
    for (const d of deals) map[d.stage] = (map[d.stage]||0) + (d.amount||0)
    return Object.entries(map).map(([stage, total]) => ({ stage, total }))
  }, [deals])

  // activities by type
  const actPie = useMemo(() => {
    const map: Record<string, number> = {}
    for (const a of acts) map[a.type] = (map[a.type]||0) + 1
    return Object.entries(map).map(([type, count]) => ({ type, count }))
  }, [acts])

  // mock monthly series from won deals (until you store close dates)
  const revenueSeries = useMemo(() => {
    const months = Array.from({length:12}, (_,i)=>({
      name: new Date(0, i).toLocaleString('default', { month:'short' }),
      revenue: 0
    }))
    let i = 0
    for (const d of deals) if (d.stage === 'won') { months[i%12].revenue += (d.amount||0); i++ }
    return months
  }, [deals])

  return (
    <div className="d-grid gap-3">
      <Row xs={1} md={4} className="g-3">
        <Stat title="Companies"       value={summary?.counts?.companies ?? '—'} />
        <Stat title="Contacts"        value={summary?.counts?.contacts ?? '—'} />
        <Stat title="Deals"           value={summary?.counts?.deals ?? '—'} />
        <Stat title="Revenue (Won)"   value={`$${(summary?.revenueWon||0).toLocaleString()}`} />
      </Row>

      <Row xs={1} lg={2} className="g-3">
        <Col>
          <Card><Card.Body>
            <Card.Title>Deal Value by Stage</Card.Title>
            <div style={{height:280}}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byStage}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="stage" /><YAxis /><Tooltip />
                  <Bar dataKey="total" name="Value">
                    {byStage.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card.Body></Card>
        </Col>

        <Col>
          <Card><Card.Body>
            <Card.Title>Activities by Type</Card.Title>
            <div style={{height:280}}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={actPie} dataKey="count" nameKey="type" outerRadius={100} label>
                    {actPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip /><Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card.Body></Card>
        </Col>
      </Row>

      <Row>
        <Col>
          <Card><Card.Body>
            <Card.Title>Won Revenue by Month</Card.Title>
            <div style={{height:280}}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueSeries}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" /><YAxis /><Tooltip />
                  <Line type="monotone" dataKey="revenue" stroke="#0d6efd" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card.Body></Card>
        </Col>
      </Row>
    </div>
  )
}

function Stat({title, value}:{title:string; value:any}) {
  return (
    <Col>
      <Card><Card.Body>
        <div className="text-muted small">{title}</div>
        <div className="fs-3 fw-semibold mt-2">{value}</div>
      </Card.Body></Card>
    </Col>
  )
}
