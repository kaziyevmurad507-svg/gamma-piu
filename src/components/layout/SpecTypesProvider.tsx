"use client";
import { createContext, useContext, type ReactNode } from "react";
import type { SpecType } from "@/lib/specs";

const Ctx = createContext<SpecType[]>([]);

// Gives client components the spec types (loaded once in the layout)
export const SpecTypesProvider = ({ list, children }: { list: SpecType[]; children: ReactNode }) => <Ctx value={list}>{children}</Ctx>;
export const useSpecTypes = () => useContext(Ctx);
