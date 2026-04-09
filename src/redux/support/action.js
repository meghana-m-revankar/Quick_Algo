import axiosInstance from "#axiosInstance";
import { NODE_API_ENDPOINTS } from "#constant/endPoint";

// Async action to get help categories
export const asyncGetSupportCategories = async (categoryId) => {
    const response = await axiosInstance.get(
            NODE_API_ENDPOINTS?.supportCategories,
        {
          params: {
            parent_id: categoryId
          }
        }
      );
  // Return the response data directly (success or failure response)
  return response;
};

// Async action to create support ticket
export const asyncCreateSupportTicket = async (ticketData) => {
    // Create FormData for file uploads
    const formData = new FormData();
    
    // Add all non-file data
    formData.append('category_id', ticketData.category_id);
    formData.append('sub_category_id', ticketData.sub_category_id);
    formData.append('title', ticketData.title);
    formData.append('description', ticketData.description);
    formData.append('user_id', ticketData.user_id);
    formData.append('company_id', ticketData.company_id);
    formData.append('email', ticketData.email);
    formData.append('phone_no', ticketData.phone_no);
    formData.append('user_name', ticketData.user_name);
    
    // Add files if they exist
    if (ticketData.attachments && ticketData.attachments.length > 0) {
        ticketData.attachments.forEach((attachment, index) => {
            formData.append('attachments', attachment.data);
        });
    }
  
    const response = await axiosInstance.post(
        NODE_API_ENDPOINTS?.createSupportTicket,
        formData,
        {
          headers: {    
            "Content-Type": "multipart/form-data", // Changed to multipart/form-data for file uploads
          }
        }
      );
  // Return the response data directly (success or failure response)
  return response;
};

// Async action to get user tickets
export const asyncGetUserTickets = async (userId, companyId, status = null) => {
    const params = {
        user_id: userId,
        company_id: companyId
    };
    
    if (status && status !== 'all') {
        params.status = status;
    }
  
    const response = await axiosInstance.get(
        NODE_API_ENDPOINTS?.getUserTickets,
        {
          params
        }
      );
  // Return the response data directly (success or failure response)
  return response;
};

