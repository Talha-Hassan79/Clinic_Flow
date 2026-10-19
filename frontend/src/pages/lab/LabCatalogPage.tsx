import React, { useEffect, useState } from 'react';
import {
  TestTube,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertCircle,
  X,
  Layers,
  Clock,
  Coins,
  ArrowLeft,
} from 'lucide-react';
import { Link } from 'react-router';
import { labService } from '../../services/lab.service';
import type {
  LabCatalogItem,
  CreateCatalogPayload,
  CatalogParameter,
} from '../../services/lab.service';

export const LabCatalogPage: React.FC = () => {
  const [catalog, setCatalog] = useState<LabCatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<LabCatalogItem | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Biochemistry');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number>(1000);
  const [turnaround, setTurnaround] = useState('24 hours');
  const [parameters, setParameters] = useState<CatalogParameter[]>([
    { paramKey: '', paramLabel: '', unit: '', normalRange: '', sortOrder: 0 },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadCatalog = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await labService.listCatalog();
      setCatalog(data);
    } catch {
      setError('Failed to load custom test catalog.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  const openCreateModal = () => {
    setEditingItem(null);
    setName('');
    setCategory('Biochemistry');
    setDescription('');
    setPrice(1000);
    setTurnaround('24 hours');
    setParameters([
      { paramKey: 'param1', paramLabel: 'Parameter Name', unit: 'mg/dL', normalRange: '10 - 50', sortOrder: 0 },
    ]);
    setShowModal(true);
  };

  const openEditModal = (item: LabCatalogItem) => {
    setEditingItem(item);
    setName(item.name);
    setCategory(item.category);
    setDescription(item.description || '');
    setPrice(Number(item.price) || 0);
    setTurnaround(item.turnaround || '24 hours');
    setParameters(
      item.parameters && item.parameters.length > 0
        ? item.parameters.map((p) => ({ ...p }))
        : [{ paramKey: '', paramLabel: '', unit: '', normalRange: '', sortOrder: 0 }]
    );
    setShowModal(true);
  };

  const handleAddParam = () => {
    setParameters([
      ...parameters,
      {
        paramKey: `param_${Date.now()}`,
        paramLabel: '',
        unit: '',
        normalRange: '',
        sortOrder: parameters.length,
      },
    ]);
  };

  const handleRemoveParam = (index: number) => {
    setParameters(parameters.filter((_, i) => i !== index));
  };

  const handleParamChange = (index: number, field: keyof CatalogParameter, value: any) => {
    const updated = [...parameters];
    updated[index] = { ...updated[index], [field]: value };
    // Auto-generate paramKey from label if empty
    if (field === 'paramLabel' && (!updated[index].paramKey || updated[index].paramKey.startsWith('param_'))) {
      updated[index].paramKey = value.toLowerCase().replace(/[^a-z0-9]/g, '_');
    }
    setParameters(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Test name is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const payload: CreateCatalogPayload = {
        name,
        category,
        description,
        price: Number(price) || 0,
        turnaround,
        parameters: parameters.filter((p) => p.paramLabel.trim().length > 0),
      };

      if (editingItem) {
        await labService.updateCatalogItem(editingItem.id, payload);
      } else {
        await labService.createCatalogItem(payload);
      }

      setShowModal(false);
      loadCatalog();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save test catalog profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this test profile from the catalog?')) return;
    try {
      await labService.deleteCatalogItem(id);
      loadCatalog();
    } catch {
      setError('Failed to delete catalog item.');
    }
  };

  const filteredCatalog = catalog.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              to="/lab"
              className="inline-flex items-center gap-1 text-xs text-brand-text-secondary hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Lab Workspace</span>
            </Link>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-brand-text-primary flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            <span>Custom Test Catalog Management</span>
          </h2>
          <p className="text-xs text-brand-text-secondary mt-0.5">
            Configure clinic custom investigation panels, reference ranges, turnaround times, and pricing.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="h-10 px-4 bg-primary hover:bg-blue-700 text-white text-xs font-semibold rounded-btn shadow-subtle-sm flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Test Profile</span>
        </button>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-3.5 rounded-btn bg-danger/10 border border-danger/20 text-danger text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-secondary pointer-events-none" />
          <input
            type="text"
            placeholder="Search custom test profiles by name or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-input bg-brand-card border border-brand-border text-xs text-brand-text-primary focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Catalog Grid / Table */}
      {isLoading ? (
        <div className="bg-brand-card p-12 rounded-card border border-brand-border text-center">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-brand-text-secondary">Loading custom test profiles...</p>
        </div>
      ) : filteredCatalog.length === 0 ? (
        <div className="bg-brand-card p-12 rounded-card border border-brand-border text-center">
          <TestTube className="w-10 h-10 text-brand-text-secondary/40 mx-auto mb-2" />
          <p className="text-sm font-semibold text-brand-text-primary">No Custom Test Profiles Configured</p>
          <p className="text-xs text-brand-text-secondary mt-1 max-w-sm mx-auto">
            Clinic admins can create custom diagnostic profiles with specialized parameters, units, and PKR rates.
          </p>
          <button
            onClick={openCreateModal}
            className="mt-4 px-4 py-2 bg-primary text-white text-xs font-semibold rounded-btn"
          >
            Create First Profile
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCatalog.map((item) => (
            <div
              key={item.id}
              className="bg-brand-card rounded-card border border-brand-border p-4 shadow-subtle-sm flex flex-col justify-between hover:border-primary/50 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wide border border-blue-100">
                    {item.category}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(item)}
                      className="p-1.5 rounded-btn hover:bg-brand-bg text-brand-text-secondary hover:text-primary transition-colors cursor-pointer"
                      title="Edit Profile"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 rounded-btn hover:bg-brand-bg text-brand-text-secondary hover:text-danger transition-colors cursor-pointer"
                      title="Delete Profile"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-brand-text-primary">{item.name}</h3>
                {item.description && (
                  <p className="text-[11px] text-brand-text-secondary mt-1 line-clamp-2">{item.description}</p>
                )}

                <div className="mt-3 flex items-center gap-3 text-xs text-brand-text-secondary border-t border-brand-border pt-2.5">
                  <div className="flex items-center gap-1 font-semibold text-emerald-600">
                    <Coins className="w-3.5 h-3.5" />
                    <span>PKR {Number(item.price).toLocaleString()}</span>
                  </div>
                  {item.turnaround && (
                    <div className="flex items-center gap-1 text-[11px]">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{item.turnaround}</span>
                    </div>
                  )}
                </div>

                {/* Parameters Preview */}
                <div className="mt-3 bg-brand-bg/60 p-2.5 rounded-btn border border-brand-border/60">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase text-brand-text-secondary mb-1.5">
                    <span>Configured Parameters</span>
                    <span>{item.parameters?.length || 0} items</span>
                  </div>
                  <div className="space-y-1">
                    {item.parameters?.slice(0, 3).map((p, idx) => (
                      <div key={idx} className="flex justify-between text-[11px] text-brand-text-primary">
                        <span className="font-medium truncate">{p.paramLabel}</span>
                        <span className="text-brand-text-secondary text-[10px] font-mono shrink-0 ml-2">
                          {p.normalRange} {p.unit}
                        </span>
                      </div>
                    ))}
                    {(item.parameters?.length || 0) > 3 && (
                      <p className="text-[10px] text-primary font-medium pt-1">
                        + {(item.parameters?.length || 0) - 3} more parameters
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-brand-card w-full max-w-2xl max-h-[90vh] rounded-2xl border border-brand-border shadow-2xl flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-brand-border flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-brand-text-primary">
                  {editingItem ? 'Edit Test Profile' : 'Create Custom Test Profile'}
                </h3>
                <p className="text-xs text-brand-text-secondary mt-0.5">
                  Define custom laboratory parameters, reference ranges, and diagnostic fees
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-btn hover:bg-brand-bg text-brand-text-secondary cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-text-secondary mb-1">
                    Test Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Thyroid Profile (FT3, FT4, TSH)"
                    className="w-full h-9 px-3 rounded-input bg-brand-bg border border-brand-border text-xs text-brand-text-primary focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-text-secondary mb-1">
                    Department / Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-9 px-3 rounded-input bg-brand-bg border border-brand-border text-xs text-brand-text-primary focus:outline-none focus:border-primary"
                  >
                    <option value="Biochemistry">Biochemistry</option>
                    <option value="Hematology">Hematology</option>
                    <option value="Microbiology">Microbiology</option>
                    <option value="Serology & Immunology">Serology & Immunology</option>
                    <option value="Molecular Pathology">Molecular Pathology</option>
                    <option value="Urinalysis">Urinalysis</option>
                    <option value="Histopathology">Histopathology</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-text-secondary mb-1">
                    Clinic Price (PKR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full h-9 px-3 rounded-input bg-brand-bg border border-brand-border text-xs text-brand-text-primary focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-text-secondary mb-1">
                    Turnaround Time
                  </label>
                  <input
                    type="text"
                    value={turnaround}
                    onChange={(e) => setTurnaround(e.target.value)}
                    placeholder="e.g. 4-6 hours or Same Day"
                    className="w-full h-9 px-3 rounded-input bg-brand-bg border border-brand-border text-xs text-brand-text-primary focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-text-secondary mb-1">
                  Description / Clinical Indication
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Clinical notes or fasting instructions for patient..."
                  className="w-full p-2.5 rounded-input bg-brand-bg border border-brand-border text-xs text-brand-text-primary focus:outline-none focus:border-primary"
                />
              </div>

              {/* Parameters List Builder */}
              <div className="border-t border-brand-border pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-brand-text-primary">
                    Test Parameters & Reference Ranges
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddParam}
                    className="px-2.5 py-1 bg-brand-bg hover:bg-brand-border/60 text-primary text-xs font-semibold rounded-btn border border-brand-border flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Parameter</span>
                  </button>
                </div>

                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {parameters.map((param, index) => (
                    <div
                      key={index}
                      className="p-3 bg-brand-bg rounded-btn border border-brand-border flex items-center gap-2 text-xs"
                    >
                      <div className="flex-1">
                        <input
                          type="text"
                          required
                          placeholder="Label (e.g. FT3)"
                          value={param.paramLabel}
                          onChange={(e) => handleParamChange(index, 'paramLabel', e.target.value)}
                          className="w-full h-8 px-2 rounded-input bg-brand-card border border-brand-border text-xs text-brand-text-primary"
                        />
                      </div>
                      <div className="w-24">
                        <input
                          type="text"
                          placeholder="Unit (pg/mL)"
                          value={param.unit}
                          onChange={(e) => handleParamChange(index, 'unit', e.target.value)}
                          className="w-full h-8 px-2 rounded-input bg-brand-card border border-brand-border text-xs text-brand-text-primary"
                        />
                      </div>
                      <div className="w-36">
                        <input
                          type="text"
                          placeholder="Range (2.0 - 4.4)"
                          value={param.normalRange}
                          onChange={(e) => handleParamChange(index, 'normalRange', e.target.value)}
                          className="w-full h-8 px-2 rounded-input bg-brand-card border border-brand-border text-xs text-brand-text-primary"
                        />
                      </div>
                      {parameters.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveParam(index)}
                          className="p-1 text-danger hover:bg-danger/10 rounded-btn cursor-pointer"
                          title="Remove"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-brand-border pt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-brand-border rounded-btn text-xs font-semibold text-brand-text-secondary hover:bg-brand-bg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-primary hover:bg-blue-700 text-white text-xs font-semibold rounded-btn shadow-subtle-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingItem ? 'Update Profile' : 'Create Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
