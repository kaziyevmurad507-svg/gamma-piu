"use client";
import { createContext, useContext, type ReactNode } from "react";
import type { Category } from "@/lib/categories";

const Ctx = createContext<Category[]>([]);

// Gives client components the category list (loaded once in the layout)
export const CategoriesProvider = ({ list, children }: { list: Category[]; children: ReactNode }) => <Ctx value={list}>{children}</Ctx>;
export const useCategories = () => useContext(Ctx);
