import { useEffect, useState } from 'react';
import * as categoryService from '@/services/categoryService';

// One shared copy of the category tree for the navbar, filters, home page and categories page.
let cache = null;
let pending = null;
const listeners = new Set();

function normalize(tree) {
  return (Array.isArray(tree) ? tree : []).map((c) => ({ ...c, subcategories: c.subcategories || [] }));
}

function load(force = false) {
  if (!force && cache) return Promise.resolve(cache);
  if (!force && pending) return pending;
  pending = categoryService.getTree()
    .then((tree) => {
      cache = normalize(tree);
      pending = null;
      listeners.forEach((listener) => listener(cache));
      return cache;
    })
    .catch((error) => {
      pending = null;
      throw error;
    });
  return pending;
}

/** The tree, from the shared copy when it is already loaded. */
export function loadCategoryTree() {
  return load(false);
}

/** Reloads the tree (after the admin changes categories) and returns it. */
export function refreshCategoryTree() {
  return load(true);
}

/** Main categories, each with `subcategories`. */
export function useCategoryTree() {
  const [categories, setCategories] = useState(cache);
  const [error, setError] = useState(null);

  useEffect(() => {
    listeners.add(setCategories);
    if (!cache) {
      load().then(setCategories).catch(setError);
    }
    return () => listeners.delete(setCategories);
  }, []);

  return { categories: categories || [], loading: !categories && !error, error };
}
