import React, { useEffect, useState, useCallback } from "react";
import {
  asyncGetHelpCategories,
  asyncGetHelpStructure,
} from "#redux/help/action";
import { checkLogin } from "#helpers";

const useFaq = () => {
  const [helpCategories, setHelpCategories] = useState([]);
  const [helpStructure, setHelpStructure] = useState({});
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const getHelpCategories = async () => {
    setCategoriesLoading(true);
    try {
      const res = await asyncGetHelpCategories();
      
      if (res?.data?.status) {
        setHelpCategories(res?.data?.data);
      } else {
        setHelpCategories([]);
      }
    } catch (error) {
      if (error.response?.status === 403) {
      }
      setHelpCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const getHelpStructure = useCallback(async (category_id) => {
    if (!category_id) return;

    setLoading(true);
    try {
      const res = await asyncGetHelpStructure(category_id);
      if (res?.data?.status) {
        setHelpStructure(res?.data?.data);
      } else {
        setHelpStructure({});
      }
    } catch (error) {
      if (error.response?.status === 403) {
      }
      setHelpStructure({});
    } finally {
      setLoading(false);
    }
  }, []);

  // Automatically fetch help structure when helpCategories change
  useEffect(() => {
    if (helpCategories && helpCategories.length > 0) {
      getHelpStructure(helpCategories[0]?.id);
    }
  }, [helpCategories, getHelpStructure]);

  // Add a function to fetch help structure for a specific category
  const fetchHelpStructureForCategory = useCallback(async (categoryId) => {
    if (!categoryId) return;
    await getHelpStructure(categoryId);
  }, [getHelpStructure]);

  useEffect(() => {
    // Only fetch help categories if user is logged in
    if (checkLogin()) {
      getHelpCategories();
    } else {
      setCategoriesLoading(false);
    }
  }, []);

  return {
    helpCategories,
    helpStructure,
    loading,
    categoriesLoading,
    fetchHelpStructureForCategory,
  };
};

export default useFaq;
