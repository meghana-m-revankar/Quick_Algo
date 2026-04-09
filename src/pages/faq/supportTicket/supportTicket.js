import React, { useState, useEffect, useCallback, useRef } from 'react';
import { asyncGetSupportCategories, asyncCreateSupportTicket, asyncGetUserTickets } from '#redux/support/action';
import { useSelector } from 'react-redux';
import Joi from 'joi';
import Storage from '#services/storage';

const useSupportTicket = () => {
    // Get user details from Redux state
    const { userDetail } = useSelector((state) => state.userDetails);
    const { companyDetails } = useSelector((state) => state.companyDetails);
    // Ref for auto-refresh interval
    const autoRefreshIntervalRef = useRef(null);
  
    // Joi validation schema
    const validationSchema = Joi.object({
        category: Joi.string().required().messages({
            'string.empty': 'Please select a category',
            'any.required': 'Please select a category'
        }),
        subCategory: Joi.string().required().messages({
            'string.empty': 'Please select a sub-category',
            'any.required': 'Please select a sub-category'
        }),
        title: Joi.string().min(5).max(255).required().messages({
            'string.empty': 'Title is required',
            'string.min': 'Title must be at least 5 characters',
            'string.max': 'Title must be less than 255 characters',
            'any.required': 'Title is required'
        }),
        description: Joi.string().min(10).max(1000).required().messages({
            'string.empty': 'Description is required',
            'string.min': 'Description must be at least 10 characters',
            'string.max': 'Description must be less than 1000 characters',
            'any.required': 'Description is required'
        }),
        attachments: Joi.array().items(Joi.object()).max(3).optional().messages({
            'array.max': 'Maximum 3 attachments allowed'
        })
    }).unknown(true);

    const [categories, setCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    const [tickets, setTickets] = useState({
        active: [],
        resolved: [],
        reject: [],
        all: []
    });
    const [ticketCounts, setTicketCounts] = useState({
        active: 0,
        resolved: 0,
        reject: 0,
        all: 0
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isTicketsLoading, setIsTicketsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [lastRefreshTime, setLastRefreshTime] = useState(null);
    
    // Initialize form data with proper user details
    const getInitialFormData = useCallback(() => ({
        category: "",
        subCategory: "",
        title: "",
        description: "",
        attachments: [],
        userId: Storage.decryptData(localStorage.getItem("customerID")) || userDetail?.userId || userDetail?.id || "",
        companyId: companyDetails?.companyID || "",
        userName: userDetail?.userName || "",
        email: userDetail?.emailid || userDetail?.email || "",
        phone: userDetail?.mobileNo || userDetail?.phone || "",
    }), [userDetail, companyDetails]);

    const [formData, setFormData] = useState(getInitialFormData);
    const [formErrors, setFormErrors] = useState({
        category: "",
        subCategory: "",
        title: "",
        description: "",
    });

    // Reset form to initial state
    const resetForm = useCallback(() => {
        const initialData = getInitialFormData();
        setFormData(initialData);
        setFormErrors({
            category: "",
            subCategory: "",
            title: "",
            description: "",
        });
        setError(null);
        setSuccessMessage(null);
    }, [getInitialFormData]);

    // Fetch support categories on component mount
    const fetchCategories = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            
            const response = await asyncGetSupportCategories();
            
            if (response?.data?.status) {
                setCategories(response.data.data || []);
            } else {
                setError(response?.data?.message || 'Failed to fetch categories');
            }
        } catch (error) {
            // Error fetching categories
            setError('Failed to fetch categories. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Fetch sub-categories when category changes
    const fetchSubCategories = useCallback(async (categoryId) => {
        if (!categoryId) {
            setSubCategories([]);
            return;
        }

        try {
            setIsLoading(true);
            setError(null);
            
            const response = await asyncGetSupportCategories(categoryId);
            
            if (response?.data?.status) {
                setSubCategories(response.data.data || []);
            } else {
                setError(response?.data?.message || 'Failed to fetch sub-categories');
                setSubCategories([]);
            }
        } catch (error) {
            // Error fetching sub-categories
            setError('Failed to fetch sub-categories. Please try again.');
            setSubCategories([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Fetch user tickets
    const fetchTickets = useCallback(async (showLoading = true) => {
        const currentUserId =  Storage.decryptData(localStorage.getItem("customerID")) || userDetail?.userId || userDetail?.id;
        const currentCompanyId = companyDetails?.companyID;
        
        if (!currentUserId || !currentCompanyId) {
            // User ID or Company ID not available
            return;
        }

        try {
            if (showLoading) {
                setIsTicketsLoading(true);
            }
            setError(null);

            // Fetch all tickets
            const allTicketsResponse = await asyncGetUserTickets(currentUserId, currentCompanyId);
            
            if (allTicketsResponse?.data?.status) {
                const allTickets = allTicketsResponse.data.data || [];
                
                // Categorize tickets by status
                const activeTickets = allTickets.filter(ticket => ticket.status === 'pending');
                const resolvedTickets = allTickets.filter(ticket => ticket.status === 'resolved');
                const rejectTickets = allTickets.filter(ticket => ticket.status === 'reject');
                
                setTickets({
                    active: activeTickets,
                    resolved: resolvedTickets,
                    reject: rejectTickets,
                    all: allTickets
                });
                
                setTicketCounts({
                    active: activeTickets.length,
                    resolved: resolvedTickets.length,
                    reject: rejectTickets.length,
                    all: allTickets.length
                });
                
                // Update last refresh time
                setLastRefreshTime(new Date());
            } else {
                setError(allTicketsResponse?.data?.message || 'Failed to fetch tickets');
            }
        } catch (error) {
            // Error fetching tickets
            setError('Failed to fetch tickets. Please try again.');
        } finally {
            if (showLoading) {
                setIsTicketsLoading(false);
            }
        }
    }, [userDetail, companyDetails]);

    // Start auto-refresh interval
    const startAutoRefresh = useCallback(() => {
        // Clear existing interval
        if (autoRefreshIntervalRef.current) {
            clearInterval(autoRefreshIntervalRef.current);
        }
        
        // Set new interval - refresh every 30 seconds
        autoRefreshIntervalRef.current = setInterval(() => {
            fetchTickets(false); // Don't show loading indicator for auto-refresh
        }, 30000); // 30 seconds
    }, [fetchTickets]);

    // Stop auto-refresh interval
    const stopAutoRefresh = useCallback(() => {
        if (autoRefreshIntervalRef.current) {
            clearInterval(autoRefreshIntervalRef.current);
            autoRefreshIntervalRef.current = null;
        }
    }, []);

    // Validate form field using Joi
    const validateField = useCallback((name, value) => {
        const fieldSchema = Joi.object({
            [name]: validationSchema.extract(name)
        });
        
        const { error } = fieldSchema.validate({ [name]: value });
        
        if (error) {
            return error.details[0].message;
        }
        
        return "";
    }, [validationSchema]);

    // Handle form field changes
    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        
        // Update form data
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear field error when user starts typing
        setFormErrors(prev => ({
            ...prev,
            [name]: ""
        }));

        // Clear general error when user makes changes
        if (error) {
            setError(null);
        }

        // If category changes, fetch sub-categories
        if (name === 'category' && value) {
            fetchSubCategories(value);
            // Reset sub-category when category changes
            setFormData(prev => ({
                ...prev,
                subCategory: ""
            }));
            // Clear sub-category error
            setFormErrors(prev => ({
                ...prev,
                subCategory: ""
            }));
        }
    }, [fetchSubCategories, error]);

    // Validate entire form using Joi
    const validateForm = useCallback(() => {
        const { error } = validationSchema.validate(formData, { abortEarly: false });
        
        if (error) {
            const errors = {};
            error.details.forEach(detail => {
                const fieldName = detail.path[0];
                errors[fieldName] = detail.message;
            });
            setFormErrors(errors);
            return false;
        }
        
        setFormErrors({});
        return true;
    }, [formData, validationSchema]);

    // Handle form submission
    const handleSubmit = useCallback(async (e, onHide, onTicketCreated) => {
        e.preventDefault();

        // Validate form before submission
        if (!validateForm()) {
            return;
        }

        try {
            setIsLoading(true);
            setError(null);
            setSuccessMessage(null);

            // Convert files to the format expected by the backend
            const processedAttachments = formData.attachments.map(file => ({
                name: file.name,
                type: file.type,
                size: file.size,
                data: file
            }));

            // Prepare ticket data for API
            const ticketData = {
                category_id: formData.category,
                sub_category_id: formData.subCategory,
                title: formData.title,
                description: formData.description,
                user_id: formData.userId,
                company_id: formData.companyId,
                email: formData.email,
                phone_no: formData.phone,
                attachments: processedAttachments,
                user_name: formData.userName,
            };

            // Call create ticket API
            const response = await asyncCreateSupportTicket(ticketData);
            
            if (response?.data?.status) {
                // Ticket created successfully
                setSuccessMessage('Ticket created successfully!');
                
                // Reset form
                resetForm();
                
                // Immediately refresh tickets to show the new ticket
                fetchTickets(false);
                
                // Close modal after a short delay
                setTimeout(() => {
                    onHide();
                    // Call the callback to refresh tickets in parent component
                    if (onTicketCreated) {
                        onTicketCreated();
                    }
                }, 1500);
                
            } else {
                setError(response?.data?.message || 'Failed to create ticket');
            }
        } catch (error) {
            // Error submitting ticket
            setError('Failed to create ticket. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [formData, validateForm, resetForm, fetchTickets]);

    // Handle file upload
    const handleFileUpload = useCallback((e) => {
        const files = Array.from(e.target.files);
        
        // Validate file count
        if (formData.attachments.length + files.length > 3) {
            setError('Maximum 3 attachments allowed');
            return;
        }
        
        // Validate file types
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        const invalidFiles = files.filter(file => !allowedTypes.includes(file.type));
        
        if (invalidFiles.length > 0) {
            setError('Invalid file type. Please upload PDF, PNG, JPG, JPEG, DOC, or DOCX files only.');
            return;
        }
        
        // Validate file size (5MB limit)
        const maxSize = 5 * 1024 * 1024; // 5MB
        const oversizedFiles = files.filter(file => file.size > maxSize);
        
        if (oversizedFiles.length > 0) {
            setError('File size too large. Maximum file size is 5MB.');
            return;
        }
        
        setFormData(prev => ({
            ...prev,
            attachments: [...prev.attachments, ...files]
        }));
        
        // Clear any previous file-related errors
        setError(null);
        
        // Clear file input
        e.target.value = '';
    }, [formData.attachments]);

    // Remove attachment
    const removeAttachment = useCallback((index) => {
        setFormData(prev => ({
            ...prev,
            attachments: prev.attachments.filter((_, i) => i !== index)
        }));
        setError(null);
    }, []);

    // Fetch categories on mount
    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    // Fetch tickets when user and company details are available
    useEffect(() => {
        if (userDetail && companyDetails) {
            fetchTickets();
            // Start auto-refresh
            startAutoRefresh();
        }
        
        // Cleanup auto-refresh on unmount
        return () => {
            stopAutoRefresh();
        };
    }, [fetchTickets, userDetail, companyDetails, startAutoRefresh, stopAutoRefresh]);

    // Update form data when user/company details change
    useEffect(() => {
        const initialData = getInitialFormData();
        setFormData(initialData);
    }, [getInitialFormData]);

    return {
        // State
        categories,
        subCategories,
        tickets,
        ticketCounts,
        isLoading,
        isTicketsLoading,
        error,
        successMessage,
        formData,
        formErrors,
        lastRefreshTime,
        
        // Actions
        handleChange,
        handleSubmit,
        handleFileUpload,
        removeAttachment,
        setError,
        fetchTickets,
        resetForm,
        
        // Validation
        validateField,
        validateForm,
    };
};

export default useSupportTicket;