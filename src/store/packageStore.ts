import { create } from 'zustand';
import type { Package, PackagePurchase } from '../../shared/types';
import { apiClient } from '../lib/api';

interface PackageState {
  packages: Package[];
  myPackages: PackagePurchase[];
  loading: boolean;
  fetchPackages: (counselorId: string) => Promise<boolean>;
  fetchMyPackages: () => Promise<boolean>;
  purchasePackage: (packageId: string) => Promise<PackagePurchase | null>;
}

export const usePackageStore = create<PackageState>((set) => ({
  packages: [],
  myPackages: [],
  loading: false,

  fetchPackages: async (counselorId: string) => {
    set({ loading: true });
    const res = await apiClient.get<Package[]>(`/packages/counselor/${counselorId}`);
    if (res.success && res.data) {
      set({ packages: res.data, loading: false });
      return true;
    }
    set({ loading: false });
    return false;
  },

  fetchMyPackages: async () => {
    set({ loading: true });
    const res = await apiClient.get<PackagePurchase[]>('/packages/me');
    if (res.success && res.data) {
      set({ myPackages: res.data, loading: false });
      return true;
    }
    set({ loading: false });
    return false;
  },

  purchasePackage: async (packageId: string) => {
    set({ loading: true });
    const res = await apiClient.post<PackagePurchase>('/packages/purchase', { packageId });
    if (res.success && res.data) {
      set((state) => ({
        myPackages: [...state.myPackages, res.data!],
        loading: false,
      }));
      return res.data;
    }
    set({ loading: false });
    return null;
  },
}));
