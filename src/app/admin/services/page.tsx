'use client';

import React, { useState, useEffect } from 'react';
import ConfirmModal from '@/components/admin/shared/ConfirmModal';
import LoadingSkeleton from '@/components/admin/shared/LoadingSkeleton';
import { Plus, Edit2, Trash2, Power, Clock, CircleDollarSign } from 'lucide-react';

interface ServiceItem {
  id: string;
  category_id: string;
  name: string;
  description: string;
  base_price: number;
  estimated_mins: number;
  is_active: boolean;
  created_at: string;
}

interface ServiceCategory {
  id: string;
  name: string;
  icon_url: string;
  is_active: boolean;
  sort_order: number;
  service_items: ServiceItem[];
}

export default function ServicesPage() {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active Category selection
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string | null>(null);

  // Modals state
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ServiceItem | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ServiceItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [isDeleteCategoryOpen, setIsDeleteCategoryOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<ServiceCategory | null>(null);

  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [formCategoryName, setFormCategoryName] = useState('');
  const [formCategorySortOrder, setFormCategorySortOrder] = useState('0');
  const [formCategoryIconUrl, setFormCategoryIconUrl] = useState('');

  // Form fields
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formBasePrice, setFormBasePrice] = useState('');
  const [formEstimatedMins, setFormEstimatedMins] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);

  // Fetch all services
  async function fetchServices() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/admin/services');
      if (!res.ok) throw new Error('Failed to load services taxonomy');
      const data = await res.json();
      setCategories(data);
      
      if (data.length > 0 && !selectedCategoryTab) {
        setSelectedCategoryTab(data[0].id);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred while fetching services.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchServices();
  }, []);

  // Handle Form Open for Add Category
  const handleOpenAddCategory = () => {
    setFormCategoryName('');
    setFormCategorySortOrder('0');
    setFormCategoryIconUrl('');
    setIsAddCategoryOpen(true);
  };

  // Submit Add Category Form
  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCategoryName) {
      alert('Please enter a category name.');
      return;
    }

    try {
      setActionLoading(true);
      const res = await fetch('/api/admin/services/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formCategoryName,
          sort_order: parseInt(formCategorySortOrder) || 0,
          icon_url: formCategoryIconUrl || null
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to create service category');
      }

      const newCat = await res.json();
      setIsAddCategoryOpen(false);
      await fetchServices();
      setSelectedCategoryTab(newCat.id);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error occurred while saving service category');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Form Open for Add
  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormCategoryId(selectedCategoryTab || (categories[0]?.id || ''));
    setFormName('');
    setFormDescription('');
    setFormBasePrice('');
    setFormEstimatedMins('60');
    setFormIsActive(true);
    setIsAddEditOpen(true);
  };

  // Handle Form Open for Edit
  const handleOpenEdit = (item: ServiceItem) => {
    setEditingItem(item);
    setFormCategoryId(item.category_id);
    setFormName(item.name);
    setFormDescription(item.description || '');
    setFormBasePrice(String(item.base_price));
    setFormEstimatedMins(String(item.estimated_mins));
    setFormIsActive(item.is_active);
    setIsAddEditOpen(true);
  };

  // Submit Add or Edit Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCategoryId || !formName || !formBasePrice) {
      alert('Please fill out all required fields.');
      return;
    }

    try {
      setActionLoading(true);
      const payload = {
        category_id: formCategoryId,
        name: formName,
        description: formDescription,
        base_price: parseFloat(formBasePrice),
        estimated_mins: parseInt(formEstimatedMins) || 60,
        is_active: formIsActive
      };

      if (editingItem) {
        // Edit service item
        const res = await fetch(`/api/admin/services/${editingItem.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to update service item');
        }
      } else {
        // Add service item
        const res = await fetch('/api/admin/services', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to create service item');
        }
      }

      setIsAddEditOpen(false);
      await fetchServices();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error occurred while saving service item');
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle active status directly
  const handleToggleActive = async (item: ServiceItem) => {
    try {
      const res = await fetch(`/api/admin/services/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !item.is_active }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to toggle status');
      }
      await fetchServices();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error occurred while updating status');
    }
  };

  // Open delete confirmation
  const handleOpenDelete = (item: ServiceItem) => {
    setItemToDelete(item);
    setIsDeleteOpen(true);
  };

  // Confirm soft delete
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      setActionLoading(true);
      const res = await fetch(`/api/admin/services/${itemToDelete.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to soft delete service item');
      }

      setIsDeleteOpen(false);
      setItemToDelete(null);
      await fetchServices();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error occurred while deleting service item');
    } finally {
      setActionLoading(false);
    }
  };

  // Open delete category confirmation
  const handleOpenDeleteCategory = (cat: ServiceCategory) => {
    setCategoryToDelete(cat);
    setIsDeleteCategoryOpen(true);
  };

  // Confirm delete category
  const handleConfirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    try {
      setActionLoading(true);
      const res = await fetch(`/api/admin/services/categories/${categoryToDelete.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to delete service category');
      }

      setIsDeleteCategoryOpen(false);
      setCategoryToDelete(null);
      if (selectedCategoryTab === categoryToDelete.id) {
        setSelectedCategoryTab(null);
      }
      await fetchServices();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error occurred while deleting service category');
    } finally {
      setActionLoading(false);
    }
  };

  const activeCategory = categories.find((c) => c.id === selectedCategoryTab);
  // Show active items, and filter out any items that are completely deleted if necessary.
  // Wait, our GET endpoint returns all service items in the database.
  // If they are soft deleted, is_active is false.
  const activeItems = (activeCategory?.service_items || []).filter(
    (item) => showInactive || item.is_active
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-white">Services Configuration</h1>
          <p className="text-xs text-slate-400">Loading catalog taxonomy...</p>
        </div>
        <LoadingSkeleton rows={5} cols={4} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-white select-none">Services Catalog</h1>
          <p className="text-xs text-slate-400 select-none">
            Manage the platform taxonomy, pricing, duration, and availability settings for home service options.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <label className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-400 bg-slate-900 border border-slate-800 rounded-lg cursor-pointer hover:bg-slate-850 hover:text-slate-200 transition-all select-none">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded border-slate-800 text-rose-600 focus:ring-rose-500 bg-slate-950 w-3.5 h-3.5"
            />
            Show Inactive
          </label>
          <button
            onClick={handleOpenAddCategory}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-lg transition-all select-none"
          >
            <Plus className="h-4 w-4 text-rose-500" />
            Add Category
          </button>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-lg shadow-rose-600/15 transition-all select-none"
          >
            <Plus className="h-4 w-4" />
            Add Service Item
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-800 rounded-xl text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-4">
        {categories
          .filter((cat) => showInactive || cat.is_active)
          .map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryTab(cat.id)}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                selectedCategoryTab === cat.id
                  ? 'bg-rose-600/10 border border-rose-500/30 text-rose-400'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-slate-200'
              }`}
            >
              <span className={cat.is_active ? '' : 'line-through opacity-75'}>
                {cat.name}
              </span>
              <span className="ml-2 text-xs opacity-60">
                ({(cat.service_items || []).filter((item) => showInactive || item.is_active).length})
              </span>
            </button>
          ))}
      </div>

      {/* Service Items Grid / Table */}
      {activeCategory ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-900/40 p-4 border border-slate-800/80 rounded-xl">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white">
                Items in {activeCategory.name}
              </h2>
              <p className="text-xs text-slate-500">
                ID: {activeCategory.id}
              </p>
            </div>
            <button
              onClick={() => handleOpenDeleteCategory(activeCategory)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-red-400 bg-red-950/20 border border-red-900/30 hover:bg-red-950/40 rounded-lg transition-colors select-none"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete Category
            </button>
          </div>

          {activeItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeItems.map((item) => (
                <div
                  key={item.id}
                  className={`bg-slate-900 border rounded-xl p-5 shadow-md flex flex-col justify-between space-y-4 transition-all ${
                    item.is_active ? 'border-slate-800' : 'border-slate-800/40 opacity-70'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-semibold text-white tracking-tight leading-tight">
                        {item.name}
                      </h3>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full ${
                          item.is_active
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {item.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2 h-8">
                      {item.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-300">
                    <div className="flex items-center gap-1 font-medium text-emerald-400">
                      <CircleDollarSign className="h-3.5 w-3.5" />
                      ₹{item.base_price}
                    </div>
                    <div className="flex items-center gap-1 text-slate-400">
                      <Clock className="h-3.5 w-3.5" />
                      {item.estimated_mins} mins
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      onClick={() => handleToggleActive(item)}
                      title={item.is_active ? 'Deactivate item' : 'Activate item'}
                      className={`p-1.5 rounded-lg border transition-colors ${
                        item.is_active
                          ? 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800'
                          : 'border-emerald-500/30 bg-emerald-950/10 text-emerald-400 hover:bg-emerald-900/20'
                      }`}
                    >
                      <Power className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(item)}
                      title="Edit Service Info"
                      className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleOpenDelete(item)}
                      title="Soft Delete Service"
                      className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 bg-slate-900 border border-slate-800 rounded-xl text-center">
              <p className="text-slate-400 text-sm">No services configured in this category.</p>
              <button
                onClick={handleOpenAdd}
                className="mt-4 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-850 hover:bg-slate-800 rounded-lg border border-slate-700 transition-colors"
              >
                Create First Item
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 bg-slate-900 border border-slate-800 rounded-xl text-center">
          <p className="text-slate-400 text-sm">Create a service category in the database to get started.</p>
        </div>
      )}

      {/* Create / Edit Service Item Modal */}
      {isAddEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-150"
          >
            <h3 className="text-lg font-bold text-white">
              {editingItem ? 'Edit Service Item' : 'Add New Service Item'}
            </h3>

            <div className="space-y-4">
              {/* Category selector */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Category *</label>
                <select
                  value={formCategoryId}
                  onChange={(e) => setFormCategoryId(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200 outline-none focus:border-rose-500 transition-colors"
                >
                  <option value="" disabled>Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Service Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Service Name *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Deep Cleaning, AC Repair"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200 outline-none focus:border-rose-500 transition-colors"
                />
              </div>

              {/* Service Description */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Description</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Summarize what is included in the service..."
                  rows={3}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200 outline-none focus:border-rose-500 transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Base Price */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Base Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="0.01"
                    value={formBasePrice}
                    onChange={(e) => setFormBasePrice(e.target.value)}
                    placeholder="500"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200 outline-none focus:border-rose-500 transition-colors"
                  />
                </div>

                {/* Estimated Minutes */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Est. Duration (Mins)</label>
                  <input
                    type="number"
                    min="5"
                    value={formEstimatedMins}
                    onChange={(e) => setFormEstimatedMins(e.target.value)}
                    placeholder="60"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200 outline-none focus:border-rose-500 transition-colors"
                  />
                </div>
              </div>

              {/* Is Active Toggle */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-semibold text-slate-400">Availability status</span>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-350 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600 peer-checked:after:bg-white peer-checked:after:border-rose-550"></div>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/60">
              <button
                type="button"
                onClick={() => setIsAddEditOpen(false)}
                disabled={actionLoading}
                className="px-4 py-2 text-xs font-semibold text-slate-400 bg-slate-950 border border-slate-800 hover:bg-slate-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 disabled:bg-rose-600/50 rounded-lg transition-colors flex items-center gap-1.5"
              >
                {actionLoading && (
                  <span className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                Save Item
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Create Service Category Modal */}
      {isAddCategoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <form
            onSubmit={handleCategorySubmit}
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-150"
          >
            <h3 className="text-lg font-bold text-white">
              Add New Service Category
            </h3>

            <div className="space-y-4">
              {/* Category Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Category Name *</label>
                <input
                  type="text"
                  required
                  value={formCategoryName}
                  onChange={(e) => setFormCategoryName(e.target.value)}
                  placeholder="e.g. Electrical, Cleaning, Plumbing"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200 outline-none focus:border-rose-500 transition-colors"
                />
              </div>

              {/* Sort Order */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Sort Order</label>
                <input
                  type="number"
                  value={formCategorySortOrder}
                  onChange={(e) => setFormCategorySortOrder(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200 outline-none focus:border-rose-500 transition-colors"
                />
              </div>

              {/* Icon URL */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Icon URL / Name</label>
                <input
                  type="text"
                  value={formCategoryIconUrl}
                  onChange={(e) => setFormCategoryIconUrl(e.target.value)}
                  placeholder="e.g. plug, paintbrush, wrench"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200 outline-none focus:border-rose-500 transition-colors"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/60">
              <button
                type="button"
                onClick={() => setIsAddCategoryOpen(false)}
                disabled={actionLoading}
                className="px-4 py-2 text-xs font-semibold text-slate-400 bg-slate-950 border border-slate-800 hover:bg-slate-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 disabled:bg-rose-600/50 rounded-lg transition-colors flex items-center gap-1.5"
              >
                {actionLoading && (
                  <span className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                Save Category
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        isLoading={actionLoading}
        title="Soft Delete Service Item"
        message={`Are you sure you want to delete "${itemToDelete?.name}"? It will no longer be visible to customers, but existing booking records remain intact.`}
        confirmText="Delete Service"
        cancelText="Keep Service"
        onClose={() => {
          setIsDeleteOpen(false);
          setItemToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
      />

      <ConfirmModal
        isOpen={isDeleteCategoryOpen}
        isLoading={actionLoading}
        title="Delete Service Category"
        message={`Are you sure you want to delete the category "${categoryToDelete?.name}"? This action is only allowed if there are no service items remaining in this category.`}
        confirmText="Delete Category"
        cancelText="Cancel"
        onClose={() => {
          setIsDeleteCategoryOpen(false);
          setCategoryToDelete(null);
        }}
        onConfirm={handleConfirmDeleteCategory}
      />
    </div>
  );
}
