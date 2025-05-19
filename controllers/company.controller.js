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

        const userId = req.id;
        const companies = await Company.find({ user: userId });
        if (!companies || companies.length === 0) {
            return res.status(404).json({
                message: "Companies not found.",
                success: false
            })
        }
        return res.status(200).json({
            companies,
            success: true
        })
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
            })
        }
        return res.status(200).json({
            company,
            success: true
        })
    } catch (error) {
        console.log(error);
    }
}

export const updateCompany = async (req, res) => {
    try {
        const { name, description, website, location } = req.body;
 
        const file = req.file;
        // idhar cloudinary ayega
        const fileUri = getDataUri(file);
        const cloudResponse = await cloudinary.uploader.upload(fileUri.content);
        const logo = cloudResponse.secure_url;
    
        const updateData = { name, description, website, location, logo };

        const company = await Company.findByIdAndUpdate(req.params.id, updateData, { new: true });

        if (!company) {
            return res.status(404).json({
                message: "Company not found.",
                success: false
            })
        }
        return res.status(200).json({
            message:"Company information updated.",
            success:true
        })

    } catch (error) {
        console.log(error);
    }
}