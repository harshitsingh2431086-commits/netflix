import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { db } from '../../lib/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { useForm } from 'react-hook-form';
import { Plan } from '../../types';

import { Plus, Trash2, Check, X, CreditCard } from 'lucide-react';

export const PlanManager: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const { register, handleSubmit, reset } = useForm<Plan>();

  const fetchPlans = async () => {
    const q = query(collection(db, 'plans'), orderBy('price', 'asc'));
    const snap = await getDocs(q);
    setPlans(snap.docs.map(d => ({ id: d.id, ...d.data() } as Plan)));
  };

  useEffect(() => { fetchPlans(); }, []);

  const onSubmit = async (data: Plan) => {
    try {
      const features = typeof data.features === 'string'
        ? (data.features as string).split(',').map((f: string) => f.trim())
        : [];

      await addDoc(collection(db, 'plans'), {
        ...data,
        razorpayPlanId: data.razorpayPlanId || `plan_${Date.now()}`, // Generate a placeholder ID
        price: Number(data.price),
        features,
        active: true,
        currency: 'INR'
      });

      alert("Plan created! Make sure to set a valid Razorpay Plan ID in your Razorpay dashboard.");
      setIsAdding(false);
      reset();
      fetchPlans();
    } catch (e: any) {
      alert("Error adding plan: " + e.message);
    }
  };

  const toggleStatus = async (plan: Plan) => {
    await updateDoc(doc(db, 'plans', plan.id), { active: !plan.active });
    fetchPlans();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this plan? Users on this plan might be affected.")) {
      await deleteDoc(doc(db, 'plans', id));
      fetchPlans();
    }
  };

  return (
    <AdminLayout title="Subscription Plans">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-gray-400">Manage Razorpay Subscriptions</h2>
        <button
          onClick={() => setIsAdding(true)}
          className="bg-[#e50914] text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-red-700 transition"
        >
          <Plus size={18} /> Add Plan
        </button>
      </div>

      {isAdding && (
        <div className="bg-[#1f1f1f] p-6 rounded-lg border border-gray-800 mb-8 animate-in slide-in-from-top-4">
          <h3 className="font-bold mb-4">New Subscription Plan</h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Plan Name</label>
                <input {...register('name', { required: true })} placeholder="e.g. Premium 4K" className="w-full bg-[#333] rounded p-2 text-white border border-gray-600" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Razorpay Plan ID</label>
                <input {...register('razorpayPlanId')} className="w-full bg-[#333] rounded p-2 text-white border border-gray-600" placeholder="plan_..." />
                <span className="text-[10px] text-gray-500">Leave empty to auto-generate ID</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Price (INR)</label>
                <input type="number" {...register('price', { required: true })} className="w-full bg-[#333] rounded p-2 text-white border border-gray-600" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Quality</label>
                <select {...register('quality')} className="w-full bg-[#333] rounded p-2 text-white border border-gray-600">
                  <option value="Good">Good</option>
                  <option value="Better">Better</option>
                  <option value="Best">Best</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Resolution</label>
                <select {...register('resolution')} className="w-full bg-[#333] rounded p-2 text-white border border-gray-600">
                  <option value="720p">720p</option>
                  <option value="1080p">1080p</option>
                  <option value="4K+HDR">4K+HDR</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Features (comma separated)</label>
              <input {...register('features')} placeholder="No Ads, Download, Multi-device" className="w-full bg-[#333] rounded p-2 text-white border border-gray-600" />
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 rounded text-gray-300 hover:text-white">Cancel</button>
              <button type="submit" className="bg-[#e50914] px-6 py-2 rounded font-bold">Save Plan</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map(plan => (
          <div key={plan.id} className={`relative bg-[#1f1f1f] rounded-lg border ${plan.active ? 'border-gray-700' : 'border-red-900/50 opacity-75'} p-6 flex flex-col`}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <div className="text-2xl font-bold text-[#e50914]">₹{plan.price}<span className="text-sm text-gray-400 font-normal">/mo</span></div>
              </div>
              <div className={`px-2 py-1 rounded text-xs font-bold ${plan.active ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'}`}>
                {plan.active ? 'ACTIVE' : 'DISABLED'}
              </div>
            </div>

            <div className="flex-1 space-y-2 mb-6">
              <p className="text-sm text-gray-400 flex items-center gap-2"><CreditCard size={14} /> ID: {plan.razorpayPlanId}</p>
              <p className="text-sm text-gray-400">Resolution: {plan.resolution}</p>
              <ul className="text-sm text-gray-300 list-disc list-inside">
                {plan.features?.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            </div>

            <div className="border-t border-gray-700 pt-4 flex justify-between">
              <button onClick={() => toggleStatus(plan)} className="text-sm text-gray-400 hover:text-white flex items-center gap-1">
                {plan.active ? <X size={14} /> : <Check size={14} />} {plan.active ? 'Disable' : 'Enable'}
              </button>
              <button onClick={() => handleDelete(plan.id)} className="text-sm text-red-500 hover:text-red-400 flex items-center gap-1">
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>
      {plans.length === 0 && !isAdding && (
        <div className="text-center py-12 text-gray-500">
          No plans found. Create one to get started.
        </div>
      )}
    </AdminLayout>
  );
};