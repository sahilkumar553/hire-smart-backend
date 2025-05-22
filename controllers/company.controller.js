import { Company } from "../models/company.model.js";
import getDataUri from "../utils/datauri.js";
import cloudinary from "../utils/cloudinary.js";

export const registerCompany = async (req, res) => {
    try {
        const { companyName } = req.body;
        if (!companyName) {
            return res.status(400).json({
                message: "Company name is required.",
                success: false
            });
        }

        if (!req.id) {
            return res.status(401).json({
                message: "User not authenticated.",
                success: false
            });
        }

        // Check if user already has a company
        const existingCompany = await Company.findOne({ user: req.id });
        if (existingCompany) {
            return res.status(400).json({
                message: "You already have a registered company.",
                success: false
            });
        }

        // Check if company name is already taken
        const companyWithSameName = await Company.findOne({ name: companyName });
        if (companyWithSameName) {
            return res.status(400).json({
                message: "Company name is already taken.",
                success: false
            });
        }

        const company = await Company.create({
            name: companyName,
            user: req.id
        });

        return res.status(201).json({
            message: "Company registered successfully.",
            company,
            success: true
        });
    } catch (error) {
        console.error('Error in registerCompany:', error);
        return res.status(500).json({
            message: "Error registering company.",
            error: error.message,
            success: false
        });
    }
}

export const getCompany = async (req, res) => {
    try {
        if (!req.id) {
            return res.status(401).json({
                message: "User not authenticated.",
                success: false
            });
        }

        console.log('getCompany called for user:', req.id);
        const userId = req.id;
        const companies = await Company.find({ user: userId });
        
        // Return empty array instead of 404 when no companies found
        return res.status(200).json({
            companies: companies || [],
            success: true
        });
    } catch (error) {
        console.error('Error in getCompany:', error);
        return res.status(500).json({
            message: "Error fetching companies.",
            error: error.message,
            success: false
        });
    }
}

// get company by id
export const getCompanyById = async (req, res) => {
    try {
        const companyId = req.params.id;
        const company = await Company.findById(companyId);
        if (!company) {
            return res.status(404).json({
                message: "Company not found.",
                success: false
            });
        }
        return res.status(200).json({
            company,
            success: true
        });
    } catch (error) {
        console.error('Error in getCompanyById:', error);
        return res.status(500).json({
            message: "Error fetching company.",
            error: error.message,
            success: false
        });
    }
}

export const updateCompany = async (req, res) => {
    try {
        const { name, description, website, location } = req.body;
 
        const file = req.file;
        let logo;
        
        if (file) {
            try {
                const fileUri = getDataUri(file);
                const cloudResponse = await cloudinary.uploader.upload(fileUri.content);
                logo = cloudResponse.secure_url;
            } catch (uploadError) {
                console.error('Error uploading to cloudinary:', uploadError);
                return res.status(500).json({
                    message: "Error uploading company logo.",
                    success: false,
                    error: uploadError.message
                });
            }
        }
    
        const updateData = {};
        if (name) updateData.name = name;
        if (description) updateData.description = description;
        if (website) updateData.website = website;
        if (location) updateData.location = location;
        if (logo) updateData.logo = logo;

        const company = await Company.findByIdAndUpdate(req.params.id, updateData, { new: true });

        if (!company) {
            return res.status(404).json({
                message: "Company not found.",
                success: false
            });
        }
        
        return res.status(200).json({
            message:"Company information updated.",
            success: true,
            company
        });
    } catch (error) {
        console.error('Error in updateCompany:', error);
        return res.status(500).json({
            message: "Error updating company.",
            error: error.message,
            success: false
        });
    }
}