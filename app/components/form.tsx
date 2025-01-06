"use client";

import { useState, ChangeEvent, FormEvent,useEffect } from "react";
import toast from "react-hot-toast";
import { Button } from "../ui/button";
// Define the structure of form data using TypeScript interfaces
interface FormData {
  formType: "inward" | "outward";
  buildingName: string;

  items: Array<{
    description: string;
    quantity: number;
    itemCode: string;
    modelName: string;
  }>;
  otherAddress: string;
  returnable: boolean;

  dateofReturn: string | null;
  requesterName: string;

}



const email = localStorage.getItem('email');
console.log("Email:", email);
const Form = () => {
  const [formData, setFormData] = useState<FormData>({
    formType: "inward",
    buildingName: localStorage.getItem('assignedbuilding') || "",
    items: [],
    otherAddress: "",
    returnable: false,
    dateofReturn: null,
    requesterName: email || "",

  });


  const [buildingOptions, setBuildingOptions] = useState<string[]>([]);
  const [vendorOptions, setVendorOptions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch buildingOptions and vendorOptions on component mount
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [buildingRes, vendorRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_DGPBE_URL}/forms/locations`), // API endpoint for building options
          fetch(`${process.env.NEXT_PUBLIC_DGPBE_URL}/forms/vendors`), // API endpoint for vendor options
        ]);

        if (!buildingRes.ok || !vendorRes.ok) {
          throw new Error("Failed to fetch options");
        }

        const buildingData = await buildingRes.json();
        const vendorData = await vendorRes.json();

        setBuildingOptions(buildingData);
        setVendorOptions(vendorData);
      } catch (error) {
        console.error("Error fetching options:", error);
        toast.error("Failed to load options. Please try again later.");
      }
    };

    fetchOptions();
  }, []);

  // Handle individual items in the items array
  const handleItems = (index: number) => {
    const newItems = [...formData.items];
    if (index === -1) {
      newItems.push({ description: "", quantity: 1, itemCode: "", modelName: "" });
    } else {
      newItems.splice(index, 1);
    }
    setFormData((prev) => ({ ...prev, items: newItems }));
  };

  const handleItemChange = (index: number, field: string, value: string | number) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setFormData((prev) => ({ ...prev, items: updatedItems }));
  };

  // Handle form field changes
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validation check
      const requiredFields = {

        otherAddress: 'Address',

        requesterName: 'Requester Name'
      };
    
      // Check required fields
      for (const [field, label] of Object.entries(requiredFields)) {
        if (!formData[field as keyof FormData]) {
          toast.error(`${label} is required`);
          return;
        }
      }
    
      // Check if items array is empty
      if (formData.items.length === 0) {
        toast.error('At least one item is required');
        return;
      }
    
      // Check if all items have required fields
      const hasEmptyItems = formData.items.some(
        item => !item.description || !item.itemCode || !item.modelName
      );
      if (hasEmptyItems) {
        toast.error('All item fields must be filled');
        return;
      }
    
      // Log the form data to check the exact structure
      console.log("Form Data Sent:", formData);
  
      const dto: FormData = {
        formType: formData.formType,
        buildingName: localStorage.getItem('assignedbuilding') || "",
        items: formData.items,
        otherAddress: formData.otherAddress,
        returnable: formData.returnable,

        dateofReturn: formData.returnable ? formData.dateofReturn : null, // Send null if not returnable
        requesterName: formData.requesterName,
 
      };
      console.log("DTO being sent to server:", JSON.stringify(dto, null, 2));
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_DGPBE_URL}/forms`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(dto), // Ensure the exact DTO is sent
        });
  
        if (response.ok) {
          toast.success('Gate pass created successfully!', {
            duration: 3000,
            position: 'top-center',
          });
          setTimeout(() => {
            window.location.href = '/dashboard/ViewGatePass';
          }, 1000);
        } else {
          toast.error('Failed to create gate pass. Please try again.', {
            duration: 3000,
            position: 'top-center',
          });
        }
      } catch (error) {
        console.error("Error during form submission:", error);
        toast.error('An error occurred. Please try again.', {
          duration: 3000,
          position: 'top-center',
        });
      }
    } catch (error) {
      console.error("Error during form submission:", error);
      toast.error('An error occurred. Please try again.', {
        duration: 3000,
        position: 'top-center',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-5xl mx-auto p-6 bg-white shadow-md rounded-lg space-y-6"
    >
      <h2 className="text-lg font-bold text-gray-700">Create Form</h2>

      {/* Form Type */}
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-2">Form Type:</label>
        <div className="flex items-center space-x-4">
          {["inward", "outward"].map((type) => (
            <label key={type} className="flex items-center space-x-2">
              <input
                type="radio"
                name="formType"
                value={type}
                checked={formData.formType === type}
                onChange={handleChange}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
            </label>
          ))}
        </div>
      </div>




      {/* Items */}
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-2">Items:</label>
        <ul className="space-y-4">
          {formData.items.map((item, index) => (
            <li key={index} className="grid grid-cols-5 gap-4 items-center">
              <input 
                type="text" 
                placeholder="Description" 
                value={item.description} 
                onChange={(e) => handleItemChange(index, 'description', e.target.value)} 
                className="rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="flex items-center space-x-2">
                <button 
                  type="button" 
                  onClick={() => handleItemChange(index, 'quantity', item.quantity - 1)} 
                  disabled={item.quantity <= 0}
                  className="px-2 py-1 bg-blue-600 text-black rounded-md shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200"
                >
                  -
                </button>
                <input 
                  type="number" 
                  value={item.quantity} 
                  onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value, 10) || 0)} 
                  className="w-12 text-center rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
                <button 
                  type="button" 
                  onClick={() => handleItemChange(index, 'quantity', item.quantity + 1)} 
                  className="px-2 py-1 bg-blue-600 text-black rounded-md shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200"
                >
                  +
                </button>
              </div>
              <input 
                type="text" 
                placeholder="Item Code" 
                value={item.itemCode} 
                onChange={(e) => handleItemChange(index, 'itemCode', e.target.value)} 
                className="rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
              <input 
                type="text" 
                placeholder="Model Name" 
                value={item.modelName} 
                onChange={(e) => handleItemChange(index, 'modelName', e.target.value)} 
                className="rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
              <button 
                type="button" 
                onClick={() => handleItems(index)} 
                className="bg-blue-600 text-black rounded-md shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200"
              >
                Remove
              </button>
            </li>

          ))}
          <li>
            <div className="flex justify-center mt-4">
              <button
              type="button"
              onClick={() => handleItems(-1)}
              className="px-16 py-2 bg-blue-600 text-black rounded-md shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200"
              >
              + Add Item
              </button>
            </div>
          </li>
        </ul>
      </div>
        {/* Other Fields */}
        <div className="space-y-6">
            <div>
            <label htmlFor="otherAddress" className="block text-sm font-medium text-gray-600 mb-2">
              {formData.formType === 'inward' ? 'From Address:' : 'To Address:'}
            </label>
            <select
              id="otherAddress"
              name="otherAddress"
              onChange={handleChange}
              value={formData.otherAddress}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select an address</option>
              {buildingOptions.concat(vendorOptions).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
              ))}
            </select>
            </div>

          <div className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              id="returnable" 
              name="returnable" 
              onChange={(e) => {
                setFormData(prev => ({
                  ...prev,
                  returnable: e.target.checked,
                  dateofReturn: e.target.checked ? prev.dateofReturn : null
                }));
              }}
              checked={formData.returnable}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="returnable" className="text-sm font-medium text-gray-600">
              Returnable
            </label>
          </div>

          <div>
            <label htmlFor="dateofReturn" className="block text-sm font-medium text-gray-600 mb-2">
              Date of Return:
            </label>
            <input 
              type="date" 
              id="dateofReturn" 
              name="dateofReturn" 
              onChange={handleChange} 
              value={formData.dateofReturn || ''}

              disabled={!formData.returnable}
              className={`block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 
                ${!formData.returnable ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            />
          </div>




          
        </div>

        {/* Submit */}
        <Button 
          type="submit" 
          disabled={isSubmitting}
          className={`w-full bg-blue-600 text-black py-2 px-4 rounded-md transform transition-all duration-200
            ${isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'hover:bg-blue-700 active:scale-95'}
            focus:ring focus:ring-blue-300 focus:ring-opacity-50`}
        >
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </Button>
      </form>
  );
};

export default Form;
