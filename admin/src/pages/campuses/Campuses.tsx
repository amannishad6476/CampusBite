import { useEffect, useState } from 'react';
import adminService from '../../services/adminService';
import { Campus, College, Block, Hostel } from '../../types';
import { Plus, Edit2, Trash2, MapPin, ChevronRight, BookOpen, Layers, Home } from 'lucide-react';

export default function Campuses() {
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [selectedCampus, setSelectedCampus] = useState<Campus | null>(null);

  // Lists inside the selected campus
  const [colleges, setColleges] = useState<College[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [hostels, setHostels] = useState<Hostel[]>([]);

  const [loading, setLoading] = useState(true);

  // Form Modals states
  const [activeModal, setActiveModal] = useState<'CAMPUS' | 'COLLEGE' | 'BLOCK' | 'HOSTEL' | null>(null);
  const [editTarget, setEditTarget] = useState<any | null>(null);
  
  // Fields for forms
  const [campusName, setCampusName] = useState('');
  const [campusAddress, setCampusAddress] = useState('');
  const [itemName, setItemName] = useState('');

  const loadCampuses = async () => {
    setLoading(true);
    try {
      const list = await adminService.getCampuses();
      setCampuses(list);
      if (list.length > 0 && !selectedCampus) {
        handleSelectCampus(list[0]);
      }
    } catch (err: any) {
      console.error('Failed to fetch campuses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCampus = async (campus: Campus) => {
    setSelectedCampus(campus);
    try {
      const cols = await adminService.getColleges(campus.id);
      setColleges(cols);
      
      const blks = await adminService.getBlocks(campus.id);
      setBlocks(blks);

      const hsts = await adminService.getHostels(campus.id);
      setHostels(hsts);
    } catch (e) {
      console.error('Failed to load child lists for campus:', campus.id);
    }
  };

  useEffect(() => {
    loadCampuses();
  }, []);

  const openAddModal = (type: 'CAMPUS' | 'COLLEGE' | 'BLOCK' | 'HOSTEL') => {
    setActiveModal(type);
    setEditTarget(null);
    setCampusName('');
    setCampusAddress('');
    setItemName('');
  };

  const openEditModal = (type: 'CAMPUS' | 'COLLEGE' | 'BLOCK' | 'HOSTEL', item: any) => {
    setActiveModal(type);
    setEditTarget(item);
    if (type === 'CAMPUS') {
      setCampusName(item.name);
      setCampusAddress(item.address || '');
    } else {
      setItemName(item.name);
    }
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModal) return;

    try {
      if (activeModal === 'CAMPUS') {
        if (editTarget) {
          await adminService.updateCampus(editTarget.id, {
            name: campusName,
            address: campusAddress,
            city_id: editTarget.city_id
          });
        } else {
          await adminService.createCampus({
            name: campusName,
            address: campusAddress,
            city_id: 1 // Lucknow
          });
        }
        await loadCampuses();
      } else if (selectedCampus) {
        if (activeModal === 'COLLEGE') {
          if (editTarget) {
            await adminService.updateCollege(editTarget.id, itemName, selectedCampus.id);
          } else {
            await adminService.createCollege(itemName, selectedCampus.id);
          }
        } else if (activeModal === 'BLOCK') {
          if (editTarget) {
            await adminService.updateBlock(editTarget.id, itemName, selectedCampus.id);
          } else {
            await adminService.createBlock(itemName, selectedCampus.id);
          }
        } else if (activeModal === 'HOSTEL') {
          if (editTarget) {
            await adminService.updateHostel(editTarget.id, itemName, selectedCampus.id);
          } else {
            await adminService.createHostel(itemName, selectedCampus.id);
          }
        }
        await handleSelectCampus(selectedCampus);
      }
      setActiveModal(null);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to save location element.');
    }
  };

  const handleDeleteItem = async (type: 'CAMPUS' | 'COLLEGE' | 'BLOCK' | 'HOSTEL', id: number) => {
    if (!window.confirm(`Are you sure you want to delete this ${type.toLowerCase()}?`)) return;

    try {
      if (type === 'CAMPUS') {
        await adminService.deleteCampus(id);
        setSelectedCampus(null);
        await loadCampuses();
      } else {
        if (type === 'COLLEGE') await adminService.deleteCollege(id);
        else if (type === 'BLOCK') await adminService.deleteBlock(id);
        else if (type === 'HOSTEL') await adminService.deleteHostel(id);
        
        if (selectedCampus) {
          await handleSelectCampus(selectedCampus);
        }
      }
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete element.');
    }
  };

  if (loading && campuses.length === 0) {
    return <div style={styles.center}>Loading locations hierarchy...</div>;
  }

  return (
    <div style={styles.container}>
      <div>
        <h2 style={styles.title}>Campus & Location Architecture</h2>
        <p style={styles.subtitle}>Configure physical hierarchy trees supporting multiple campuses, colleges, blocks, and drop points</p>
      </div>

      <div style={styles.layout}>
        {/* Left Side: Campus List */}
        <div style={styles.leftCol}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>Registered Campuses</h3>
            <button onClick={() => openAddModal('CAMPUS')} style={styles.addBtn}>
              <Plus size={16} />
              <span>Add Campus</span>
            </button>
          </div>

          <div style={styles.list}>
            {campuses.map((c) => (
              <div
                key={c.id}
                onClick={() => handleSelectCampus(c)}
                style={{
                  ...styles.listItem,
                  backgroundColor: selectedCampus?.id === c.id ? '#f3f4f6' : '#ffffff',
                  borderColor: selectedCampus?.id === c.id ? '#10b981' : '#e5e7eb',
                }}
              >
                <div style={styles.itemMain}>
                  <MapPin size={18} color="#10b981" />
                  <div style={styles.itemDetails}>
                    <span style={styles.itemName}>{c.name}</span>
                    <span style={styles.itemSub}>{c.address || 'Faizabad Road, Lucknow'}</span>
                  </div>
                </div>
                <div style={styles.actions}>
                  <button onClick={(e) => { e.stopPropagation(); openEditModal('CAMPUS', c); }} style={styles.actionBtn}>
                    <Edit2 size={14} color="#4b5563" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteItem('CAMPUS', c.id); }} style={styles.actionBtn}>
                    <Trash2 size={14} color="#ef4444" />
                  </button>
                  <ChevronRight size={16} color="#9ca3af" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Colleges, Blocks, Hostels in the selected Campus */}
        <div style={styles.rightCol}>
          {selectedCampus ? (
            <div style={styles.detailsBox}>
              <h2 style={styles.sectionHeader}>Managing: {selectedCampus.name}</h2>

              <div style={styles.gridThree}>
                {/* 1. Colleges List */}
                <div style={styles.gridCard}>
                  <div style={styles.cardHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <BookOpen size={18} color="#3b82f6" />
                      <h4 style={styles.gridCardTitle}>Colleges</h4>
                    </div>
                    <button onClick={() => openAddModal('COLLEGE')} style={styles.gridAddBtn}>
                      <Plus size={14} />
                    </button>
                  </div>
                  <div style={styles.gridList}>
                    {colleges.map((col) => (
                      <div key={col.id} style={styles.gridRow}>
                        <span style={styles.gridRowName}>{col.name}</span>
                        <div style={styles.gridRowActions}>
                          <button onClick={() => openEditModal('COLLEGE', col)} style={styles.subActionBtn}>
                            <Edit2 size={12} />
                          </button>
                          <button onClick={() => handleDeleteItem('COLLEGE', col.id)} style={styles.subActionBtn}>
                            <Trash2 size={12} color="#ef4444" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {colleges.length === 0 && <span style={styles.emptyText}>No colleges registered</span>}
                  </div>
                </div>

                {/* 2. Blocks List */}
                <div style={styles.gridCard}>
                  <div style={styles.cardHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Layers size={18} color="#8b5cf6" />
                      <h4 style={styles.gridCardTitle}>Academic Blocks</h4>
                    </div>
                    <button onClick={() => openAddModal('BLOCK')} style={styles.gridAddBtn}>
                      <Plus size={14} />
                    </button>
                  </div>
                  <div style={styles.gridList}>
                    {blocks.map((blk) => (
                      <div key={blk.id} style={styles.gridRow}>
                        <span style={styles.gridRowName}>{blk.name}</span>
                        <div style={styles.gridRowActions}>
                          <button onClick={() => openEditModal('BLOCK', blk)} style={styles.subActionBtn}>
                            <Edit2 size={12} />
                          </button>
                          <button onClick={() => handleDeleteItem('BLOCK', blk.id)} style={styles.subActionBtn}>
                            <Trash2 size={12} color="#ef4444" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {blocks.length === 0 && <span style={styles.emptyText}>No blocks registered</span>}
                  </div>
                </div>

                {/* 3. Hostels List */}
                <div style={styles.gridCard}>
                  <div style={styles.cardHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Home size={18} color="#eab308" />
                      <h4 style={styles.gridCardTitle}>Hostels / Locations</h4>
                    </div>
                    <button onClick={() => openAddModal('HOSTEL')} style={styles.gridAddBtn}>
                      <Plus size={14} />
                    </button>
                  </div>
                  <div style={styles.gridList}>
                    {hostels.map((host) => (
                      <div key={host.id} style={styles.gridRow}>
                        <span style={styles.gridRowName}>{host.name}</span>
                        <div style={styles.gridRowActions}>
                          <button onClick={() => openEditModal('HOSTEL', host)} style={styles.subActionBtn}>
                            <Edit2 size={12} />
                          </button>
                          <button onClick={() => handleDeleteItem('HOSTEL', host.id)} style={styles.subActionBtn}>
                            <Trash2 size={12} color="#ef4444" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {hostels.length === 0 && <span style={styles.emptyText}>No hostels registered</span>}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={styles.selectPrompt}>
              <MapPin size={48} color="#d1d5db" />
              <p>Select a campus to manage its colleges, academic blocks, and drop-off hostels.</p>
            </div>
          )}
        </div>
      </div>

      {/* Form Dialog Modal */}
      {activeModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>
              {editTarget ? 'Edit' : 'Add'} {activeModal.toLowerCase()}
            </h3>

            <form onSubmit={handleSaveItem} style={styles.modalForm}>
              {activeModal === 'CAMPUS' ? (
                <>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Campus Name</label>
                    <input
                      type="text"
                      value={campusName}
                      onChange={(e) => setCampusName(e.target.value)}
                      style={styles.formInput}
                      required
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Address</label>
                    <input
                      type="text"
                      value={campusAddress}
                      onChange={(e) => setCampusAddress(e.target.value)}
                      style={styles.formInput}
                      required
                    />
                  </div>
                </>
              ) : (
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>{activeModal.toLowerCase()} Name</label>
                  <input
                    type="text"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    style={styles.formInput}
                    required
                  />
                </div>
              )}

              <div style={styles.modalActions}>
                <button type="button" onClick={() => setActiveModal(null)} style={styles.cancelBtn}>Cancel</button>
                <button type="submit" style={styles.saveBtn}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px',
  },
  title: {
    fontSize: '22px',
    fontWeight: 'bold',
    color: '#111827',
    margin: 0,
  },
  subtitle: {
    fontSize: '14px',
    color: '#4b5563',
    marginTop: '4px',
  },
  layout: {
    display: 'flex',
    gap: '24px',
    alignItems: 'flex-start',
  },
  leftCol: {
    flex: '0 0 350px',
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05)',
  },
  rightCol: {
    flex: 1,
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05)',
    minHeight: '400px',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    borderBottom: '1px solid #f3f4f6',
    paddingBottom: '12px',
  },
  cardTitle: {
    fontSize: '15px',
    fontWeight: 'bold',
    color: '#111827',
    margin: 0,
  },
  addBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#10b981',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  list: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  listItem: {
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  itemMain: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flex: 1,
  },
  itemDetails: {
    display: 'flex',
    flexDirection: 'column' as const,
  },
  itemName: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#111827',
  },
  itemSub: {
    fontSize: '11px',
    color: '#6b7280',
    marginTop: '2px',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  actionBtn: {
    padding: '4px',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
  },
  selectPrompt: {
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    alignItems: 'center',
    height: '350px',
    color: '#9ca3af',
    textAlign: 'center' as const,
    padding: '0 40px',
  },
  detailsBox: {},
  sectionHeader: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: '20px',
  },
  gridThree: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '20px',
  },
  gridCard: {
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '16px',
    backgroundColor: '#f9fafb',
  },
  gridCardTitle: {
    fontSize: '13px',
    fontWeight: 'bold',
    color: '#374151',
    margin: 0,
  },
  gridAddBtn: {
    padding: '4px',
    backgroundColor: '#ffffff',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  gridList: {
    marginTop: '12px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  gridRow: {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    padding: '8px 12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gridRowName: {
    fontSize: '13px',
    color: '#374151',
    fontWeight: 500,
  },
  gridRowActions: {
    display: 'flex',
    gap: '4px',
  },
  subActionBtn: {
    padding: '2px',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: '#6b7280',
  },
  emptyText: {
    fontSize: '12px',
    color: '#9ca3af',
    fontStyle: 'italic',
    textAlign: 'center' as const,
    display: 'block',
    marginTop: '12px',
  },
  center: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '60vh',
    fontSize: '15px',
    color: '#6b7280',
  },
  modalOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#111827',
    margin: 0,
    marginBottom: '16px',
  },
  modalForm: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  formLabel: {
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#4b5563',
  },
  formInput: {
    padding: '10px 14px',
    fontSize: '14px',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    outline: 'none',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '8px',
  },
  cancelBtn: {
    padding: '8px 16px',
    backgroundColor: '#f3f4f6',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    color: '#4b5563',
  },
  saveBtn: {
    padding: '8px 16px',
    backgroundColor: '#10b981',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 'bold',
  },
};
