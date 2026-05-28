import React, { useState, useEffect } from 'react';
import { X, Calendar, FileText, Download } from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO } from 'date-fns';

const ExportModal = ({ isOpen, onClose, onExport }) => {
  if (!isOpen) return null;

  const [reportType, setReportType] = useState('weekly'); // 'daily' | 'weekly' | 'monthly' | 'custom'
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  // Monthly selections
  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState(currentYear);
  
  // Custom date range
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Previews
  const [previewText, setPreviewText] = useState('');
  const [resolvedDates, setResolvedDates] = useState({ start: new Date(), end: new Date() });

  useEffect(() => {
    const baseDate = parseISO(selectedDate);
    
    if (reportType === 'daily') {
      setPreviewText(`Xuất báo cáo cho ngày: ${format(baseDate, 'dd/MM/yyyy')}`);
      setResolvedDates({ start: baseDate, end: baseDate });
    } 
    else if (reportType === 'weekly') {
      const start = startOfWeek(baseDate, { weekStartsOn: 1 });
      const end = endOfWeek(baseDate, { weekStartsOn: 1 });
      setPreviewText(`Xuất báo cáo tuần từ Thứ Hai ${format(start, 'dd/MM/yyyy')} đến Chủ Nhật ${format(end, 'dd/MM/yyyy')}`);
      setResolvedDates({ start, end });
    } 
    else if (reportType === 'monthly') {
      // Calculate first and last day of selected month/year
      const start = new Date(selectedYear, selectedMonth - 1, 1);
      const end = endOfMonth(start);
      setPreviewText(`Xuất báo cáo tháng ${selectedMonth.toString().padStart(2, '0')}/${selectedYear} (từ ${format(start, 'dd/MM/yyyy')} đến ${format(end, 'dd/MM/yyyy')}`);
      setResolvedDates({ start, end });
    } 
    else if (reportType === 'custom') {
      const start = parseISO(startDate);
      const end = parseISO(endDate);
      if (start > end) {
        setPreviewText('Cảnh báo: Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc.');
        setResolvedDates({ start, end });
      } else {
        setPreviewText(`Xuất báo cáo từ ngày ${format(start, 'dd/MM/yyyy')} đến ${format(end, 'dd/MM/yyyy')}`);
        setResolvedDates({ start, end });
      }
    }
  }, [reportType, selectedDate, selectedMonth, selectedYear, startDate, endDate]);

  const handleExport = () => {
    if (reportType === 'custom' && resolvedDates.start > resolvedDates.end) {
      alert('Ngày bắt đầu không được lớn hơn ngày kết thúc.');
      return;
    }
    
    onExport({
      type: reportType,
      startDate: resolvedDates.start,
      endDate: resolvedDates.end
    });
    onClose();
  };

  const years = Array.from({ length: 7 }, (_, i) => currentYear - 3 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div className="modal-content animate-fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px', borderRadius: '24px', padding: '32px' }}>
        <button
          className="btn-icon"
          style={{ position: 'absolute', top: '24px', right: '24px', width: '36px', height: '36px' }}
          onClick={onClose}
        >
          <X size={18} />
        </button>

        <div className="modal-header" style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '8px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={24} color="var(--primary-accent)" />
            Xuất báo cáo công việc
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '600' }}>
            Lựa chọn loại báo cáo và mốc thời gian bạn mong muốn xuất sang file Word.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Loại báo cáo */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Loại báo cáo
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              <button 
                type="button"
                className={`btn-ghost ${reportType === 'daily' ? 'active' : ''}`}
                style={{ padding: '12px', borderRadius: '14px', fontWeight: '700', fontSize: '14px', border: reportType === 'daily' ? '2px solid var(--primary-accent)' : '1px solid var(--border-light)' }}
                onClick={() => setReportType('daily')}
              >
                📅 Báo cáo ngày
              </button>
              <button 
                type="button"
                className={`btn-ghost ${reportType === 'weekly' ? 'active' : ''}`}
                style={{ padding: '12px', borderRadius: '14px', fontWeight: '700', fontSize: '14px', border: reportType === 'weekly' ? '2px solid var(--primary-accent)' : '1px solid var(--border-light)' }}
                onClick={() => setReportType('weekly')}
              >
                📊 Báo cáo tuần
              </button>
              <button 
                type="button"
                className={`btn-ghost ${reportType === 'monthly' ? 'active' : ''}`}
                style={{ padding: '12px', borderRadius: '14px', fontWeight: '700', fontSize: '14px', border: reportType === 'monthly' ? '2px solid var(--primary-accent)' : '1px solid var(--border-light)' }}
                onClick={() => setReportType('monthly')}
              >
                🗓️ Báo cáo tháng
              </button>
              <button 
                type="button"
                className={`btn-ghost ${reportType === 'custom' ? 'active' : ''}`}
                style={{ padding: '12px', borderRadius: '14px', fontWeight: '700', fontSize: '14px', border: reportType === 'custom' ? '2px solid var(--primary-accent)' : '1px solid var(--border-light)' }}
                onClick={() => setReportType('custom')}
              >
                ⏳ Tùy chỉnh ngày
              </button>
            </div>
          </div>

          <div style={{ height: '1px', background: 'var(--border-light)' }} />

          {/* Chọn thời gian */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Chọn thời gian báo cáo
            </label>

            {/* Daily or Weekly Selection */}
            {(reportType === 'daily' || reportType === 'weekly') && (
              <div style={{ position: 'relative' }}>
                <input 
                  type="date" 
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  style={{
                    padding: '12px 16px', width: '100%', borderRadius: '12px', 
                    border: '1px solid var(--border-light)', outline: 'none', 
                    background: 'var(--bg-main)', color: 'var(--text-primary)',
                    fontWeight: '700', fontSize: '15px'
                  }}
                />
              </div>
            )}

            {/* Monthly Selection */}
            {reportType === 'monthly' && (
              <div style={{ display: 'flex', gap: '12px' }}>
                <select 
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  style={{
                    padding: '12px 16px', flex: 1, borderRadius: '12px', 
                    border: '1px solid var(--border-light)', outline: 'none', 
                    background: 'var(--bg-main)', color: 'var(--text-primary)',
                    fontWeight: '700', fontSize: '15px'
                  }}
                >
                  {months.map(m => (
                    <option key={m} value={m}>Tháng {m.toString().padStart(2, '0')}</option>
                  ))}
                </select>
                <select 
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  style={{
                    padding: '12px 16px', flex: 1, borderRadius: '12px', 
                    border: '1px solid var(--border-light)', outline: 'none', 
                    background: 'var(--bg-main)', color: 'var(--text-primary)',
                    fontWeight: '700', fontSize: '15px'
                  }}
                >
                  {years.map(y => (
                    <option key={y} value={y}>Năm {y}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Custom Range Selection */}
            {reportType === 'custom' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '800', width: '80px', color: 'var(--text-muted)' }}>Từ ngày</span>
                  <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    style={{
                      padding: '10px 14px', flex: 1, borderRadius: '12px', 
                      border: '1px solid var(--border-light)', outline: 'none', 
                      background: 'var(--bg-main)', color: 'var(--text-primary)',
                      fontWeight: '700', fontSize: '14px'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '800', width: '80px', color: 'var(--text-muted)' }}>Đến ngày</span>
                  <input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    style={{
                      padding: '10px 14px', flex: 1, borderRadius: '12px', 
                      border: '1px solid var(--border-light)', outline: 'none', 
                      background: 'var(--bg-main)', color: 'var(--text-primary)',
                      fontWeight: '700', fontSize: '14px'
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Preview Panel */}
          <div style={{ 
            padding: '16px 20px', 
            background: 'var(--primary-pastel)', 
            borderRadius: '16px', 
            borderLeft: '4px solid var(--primary-accent)',
            fontSize: '13px',
            fontWeight: '700',
            color: 'var(--primary-accent)',
            lineHeight: '1.5'
          }}>
            {previewText}
          </div>
        </div>

        <div className="modal-footer" style={{ marginTop: '32px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button 
            type="button" 
            onClick={onClose} 
            style={{ 
              background: 'var(--bg-main)', 
              color: 'var(--text-secondary)', 
              padding: '12px 24px', 
              borderRadius: '14px', 
              fontWeight: '700',
              border: '1px solid var(--border-light)',
              cursor: 'pointer'
            }}
          >
            Hủy bỏ
          </button>
          <button 
            type="button" 
            className="btn-primary" 
            onClick={handleExport}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              padding: '12px 24px', 
              borderRadius: '14px',
              fontWeight: '800'
            }}
          >
            <Download size={16} strokeWidth={2.5} />
            Xuất báo cáo Word
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
