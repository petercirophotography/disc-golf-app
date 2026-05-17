import React, { useState } from 'react';
import { useDiscs, useCreateDisc, useUpdateDisc, useDeleteDisc } from '../../hooks/useTrackerApi.js';
import DiscForm from '../../components/tracker/DiscForm.jsx';
import DiscCard from '../../components/tracker/DiscCard.jsx';

const STABILITY_ORDER = ['VOS', 'OS', 'ST', 'US', 'VUS'];

function Discs() {
  const { data: discs, loading, refetch } = useDiscs();
  const { mutate: createDisc } = useCreateDisc();
  const { mutate: updateDisc } = useUpdateDisc();
  const { mutate: deleteDisc } = useDeleteDisc();
  const [showForm, setShowForm] = useState(false);
  const [editingDisc, setEditingDisc] = useState(null);
  const [filterInBag, setFilterInBag] = useState(false);

  const handleCreate = async (data) => {
    await createDisc(data);
    setShowForm(false);
    refetch();
  };

  const handleUpdate = async (data) => {
    await updateDisc(editingDisc.id, data);
    setEditingDisc(null);
    refetch();
  };

  const handleDelete = async (disc) => {
    if (confirm(`Delete ${disc.name}?`)) {
      await deleteDisc(disc.id);
      refetch();
    }
  };

  const handleToggleBag = async (disc) => {
    await updateDisc(disc.id, { in_bag: !disc.in_bag });
    refetch();
  };

  const handleEdit = (disc) => {
    setEditingDisc(disc);
    setShowForm(false);
  };

  if (loading) return <div className="tracker-loading">Loading discs...</div>;

  const filteredDiscs = filterInBag
    ? (discs || []).filter((d) => d.in_bag)
    : (discs || []);

  // Group by stability, with Putters as a separate group
  const putters = filteredDiscs.filter((d) => d.disc_type === 'Putter');
  const nonPutters = filteredDiscs.filter((d) => d.disc_type !== 'Putter');

  const groups = STABILITY_ORDER.map((stability) => ({
    label: stability,
    discs: nonPutters.filter((d) => d.stability === stability),
  })).filter((g) => g.discs.length > 0);

  if (putters.length > 0) {
    groups.push({ label: 'Putters', discs: putters });
  }

  return (
    <div>
      <div className="tracker-page-header">
        <h1>Discs</h1>
        <button
          className="tracker-btn tracker-btn-primary"
          onClick={() => { setShowForm(true); setEditingDisc(null); }}
        >
          + Add
        </button>
      </div>

      <div className="tracker-filter-bar">
        <button
          className={`tracker-filter-btn ${!filterInBag ? 'active' : ''}`}
          onClick={() => setFilterInBag(false)}
        >
          All
        </button>
        <button
          className={`tracker-filter-btn ${filterInBag ? 'active' : ''}`}
          onClick={() => setFilterInBag(true)}
        >
          In Bag
        </button>
      </div>

      {(showForm || editingDisc) && (
        <div className="tracker-modal-overlay" onClick={() => { setShowForm(false); setEditingDisc(null); }}>
          <div className="tracker-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingDisc ? 'Edit Disc' : 'Add Disc'}</h2>
            <DiscForm
              disc={editingDisc}
              onSubmit={editingDisc ? handleUpdate : handleCreate}
              onCancel={() => { setShowForm(false); setEditingDisc(null); }}
            />
          </div>
        </div>
      )}

      {groups.length === 0 && !showForm ? (
        <div className="tracker-empty">
          <p>No discs yet</p>
          <p>Add your first disc to get started</p>
        </div>
      ) : (
        groups.map((group) => (
          <div key={group.label} className="disc-group">
            <div className="disc-group-header">{group.label}</div>
            {group.discs.map((disc) => (
              <DiscCard
                key={disc.id}
                disc={disc}
                onEdit={handleEdit}
                onToggleBag={handleToggleBag}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ))
      )}
    </div>
  );
}

export default Discs;
