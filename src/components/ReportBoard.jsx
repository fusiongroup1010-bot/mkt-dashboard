import React, { useState } from 'react';
import { Filter, Calendar, FileText, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { useEvents } from '../context/EventContext';

const ReportBoard = () => {
  const { filteredItems: allItems } = useEvents();
  const [filter, setFilter] = useState('all');

  const reports = allItems.filter(i => i.type === 'report');

  const filteredReports = filter === 'all' 
    ? reports 
    : reports.filter(r => r.status === filter);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'submitted':
        return <span className="badge-status badge-submitted"><CheckCircle size={14} strokeWidth={2.5}/>SUBMITTED</span>;
      case 'due-soon':
        return <span className="badge-status badge-due-soon"><Clock size={14} strokeWidth={2.5}/>DUE SOON</span>;
      case 'overdue':
        return <span className="badge-status badge-overdue"><AlertCircle size={14} strokeWidth={2.5}/>OVERDUE</span>;
      case 'upcoming':
        return <span className="badge-status badge-upcoming"><Calendar size={14} strokeWidth={2.5}/>UPCOMING</span>;
      default:
        return null;
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', marginBottom: '8px', color: 'var(--text-primary)' }}>Report Calendar</h1>
          <p style={{ color: 'var(--text-secondary)', fontWeight: '600', fontSize: '15px' }}>A color-coded timeline for tracking reports easily.</p>
        </div>
        
        <div className="soft-panel" style={{ display: 'flex', padding: '6px', borderRadius: 'var(--radius-md)' }}>
          <button className={`btn-ghost ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')} style={{ padding: '8px 16px', borderRadius: '12px' }}>All</button>
          <button className={`btn-ghost ${filter === 'due-soon' ? 'active' : ''}`} onClick={() => setFilter('due-soon')} style={{ padding: '8px 16px', borderRadius: '12px' }}>Due Soon</button>
          <button className={`btn-ghost ${filter === 'overdue' ? 'active' : ''}`} onClick={() => setFilter('overdue')} style={{ padding: '8px 16px', borderRadius: '12px' }}>Overdue</button>
          <button className={`btn-ghost ${filter === 'submitted' ? 'active' : ''}`} onClick={() => setFilter('submitted')} style={{ padding: '8px 16px', borderRadius: '12px' }}>Submitted</button>
        </div>
      </div>

      <div className="soft-panel animate-fade-in" style={{ padding: '32px', flex: 1, borderRadius: 'var(--radius-lg)' }}>
        
        <div style={{ display: 'flex', gap: '20px', marginBottom: '32px' }}>
           <div className="btn-icon" style={{ borderRadius: '16px' }}>
              <Filter size={20} strokeWidth={2.5} color="var(--primary-accent)" />
           </div>
           
           <input type="text" placeholder="Search reports, owners..." className="soft-panel" style={{
              flex: 1, background: 'var(--bg-main)', color: 'var(--text-primary)', padding: '0 24px', 
              borderRadius: '16px', outline: 'none', border: 'none', fontSize: '15px', fontWeight: '600',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
           }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {filteredReports.map(report => (
            <div key={report.id} className="soft-panel" style={{
              padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              borderRadius: '20px',
              borderLeft: `8px solid ${
                report.status === 'submitted' ? 'var(--green-pastel)' :
                report.status === 'overdue' ? 'var(--pink-pastel)' :
                report.status === 'due-soon' ? 'var(--orange-pastel)' : 'var(--blue-pastel)'
              }`,
              cursor: 'pointer'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <div style={{
                  width: '56px', height: '56px', borderRadius: '18px', 
                  background: report.status === 'submitted' ? 'var(--green-pastel)' :
                              report.status === 'overdue' ? 'var(--pink-pastel)' :
                              report.status === 'due-soon' ? 'var(--orange-pastel)' : 'var(--blue-pastel)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  color: report.status === 'submitted' ? 'var(--green-accent)' :
                         report.status === 'overdue' ? 'var(--pink-accent)' :
                         report.status === 'due-soon' ? 'var(--orange-accent)' : 'var(--blue-accent)',
                  boxShadow: 'inset 0 -4px 0 rgba(0,0,0,0.05)'
                }}>
                  <FileText size={28} strokeWidth={2.5} />
                </div>
                
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '6px', color: 'var(--text-primary)' }}>{report.title}</h3>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '600', display: 'flex', gap: '16px' }}>
                    <span>Dept: <span style={{ color: 'var(--text-primary)' }}>{report.department}</span></span>
                    <span style={{ color: 'var(--border-focus)' }}>•</span>
                    <span>Owner: <span style={{ color: 'var(--text-primary)' }}>{report.author}</span></span>
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '700', marginBottom: '6px', textTransform: 'uppercase' }}>Deadline</p>
                  <p style={{ fontSize: '16px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-primary)' }}>
                    <Calendar size={18} strokeWidth={2.5} color="var(--primary-accent)" />
                    {format(report.dueDate, 'MMM dd, yyyy')}
                  </p>
                </div>
                
                <div style={{ minWidth: '140px', display: 'flex', justifyContent: 'flex-end' }}>
                  {getStatusBadge(report.status)}
                </div>
              </div>
            </div>
          ))}

          {filteredReports.length === 0 && (
            <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
                 <CheckCircle size={40} color="var(--text-muted)" strokeWidth={2} />
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-secondary)' }}>No reports found!</h3>
              <p style={{ fontSize: '15px', fontWeight: '600', marginTop: '8px' }}>Everything is clean and organized.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportBoard;
