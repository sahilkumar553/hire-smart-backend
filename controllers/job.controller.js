import { Job } from "../models/job.model.js";
// admin post krega job
import { User } from "../models/user.model.js";
import Notification from "../models/Notification.js"; // Assuming you’re using CommonJS in Notification model

export const postJob = async (req, res) => {
    try {
        const { title, description, requirements, salary, location, jobType, experience, position, companyId } = req.body;
        const userId = req.id;

        if (!title || !description || !requirements || !salary || !location || !jobType || !experience || !position || !companyId) {
            return res.status(400).json({
                message: "Something is missing.",
                success: false
            });
        }

        const job = await Job.create({
            title,
            description,
            requirements: requirements.split(","),
            salary: Number(salary),
            location,
            jobType,
            experienceLevel: experience,
            position,
            company: companyId,
            created_by: userId
        });

        // Notify all students about the new job
        // Notify all students about the new job
        const students = await User.find({ role: "student" });

        const notifications = students.map((student) => ({
            userId: student._id,
            message: `📢 Hurrah, there is a new job available for you!  💼 ROLE: ${title}`,
            type: "job-post"
        }));


        await Notification.insertMany(notifications);

        return res.status(201).json({
            message: "New job created successfully and labour is notified.",
            job,
            success: true
        });
    } catch (error) {
        console.log("Error in postJob:", error);
        return res.status(500).json({
            message: "Internal Server Error",
            success: false
        });
    }
};

// student k liye
export const getAllJobs = async (req, res) => {
    try {
        const keyword = req.query.keyword || "";
        const query = {
            $or: [
                { title: { $regex: keyword, $options: "i" } },
                { description: { $regex: keyword, $options: "i" } },
            ]
        };
        const jobs = await Job.find(query).populate({
            path: "company"
        }).sort({ createdAt: -1 });
        if (!jobs) {
            return res.status(404).json({
                message: "Jobs not found.",
                success: false
            })
        };
        return res.status(200).json({
            jobs,
            success: true
        })
    } catch (error) {
        console.log(error);
    }
}
// student
export const getJobById = async (req, res) => {
    try {
        const jobId = req.params.id;
        const job = await Job.findById(jobId).populate({
            path:"applications"
        });
        if (!job) {
            return res.status(404).json({
                message: "Jobs not found.",
                success: false
            })
        };
        return res.status(200).json({ job, success: true });
    } catch (error) {
        console.log(error);
    }
}
// admin kitne job create kra hai abhi tk
export const getAdminJobs = async (req, res) => {
    try {
        const adminId = req.id;
        const jobs = await Job.find({ created_by: adminId }).populate({
            path:'company',
            createdAt:-1
        });
        if (!jobs) {
            return res.status(404).json({
                message: "Jobs not found.",
                success: false
            })
        };
        return res.status(200).json({
            jobs,
            success: true
        })
    } catch (error) {
        console.log(error);
    }
}


export const getUserNotifications = async (req, res) => {
    try {
        const userId = req.id;

        const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            notifications
        });
    } catch (error) {
        console.log("Error in getUserNotifications:", error);
        return res.status(500).json({
            message: "Failed to fetch notifications",
            success: false
        });
    }
};

export const markNotificationAsRead = async (req, res) => {
    try {
      const notificationId = req.params.id;
  
      const deletedNotification = await Notification.findByIdAndDelete(notificationId);
  
      if (!deletedNotification) {
        return res.status(404).json({ message: "Notification not found", success: false });
      }
  
      return res.status(200).json({ message: "Notification deleted", success: true });
    } catch (error) {
      console.log("Error in markNotificationAsRead:", error);
      return res.status(500).json({ message: "Internal Server Error", success: false });
    }
  };
  