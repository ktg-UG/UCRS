"use client";

import React, { createContext, useState, useContext, ReactNode } from "react";

type AdminContextType = {
  isAdmin: boolean;
  login: () => void;
  logout: () => void;
};

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const [isAdmin, setIsAdmin] = useState(false);

  const login = () => setIsAdmin(true);
  const logout = () => setIsAdmin(false);

  return (
    <AdminContext.Provider value={{ isAdmin, login, logout }}>
      {children}
    </AdminContext.Provider>
  );
};

//カスタムフック
export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
};
