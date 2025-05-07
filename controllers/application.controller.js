import { Application } from "../models/application.model.js";
import { Job } from "../models/job.model.js";

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);


export const applyJob = async (req, res) => {
    try {
        const userId = req.id;
        const jobId = req.params.id;
        if (!jobId) {
            return res.status(400).json({
                message: "Job id is required.",
                success: false
            })
        };
        // check if the user has already applied for the job
        const existingApplication = await Application.findOne({ job: jobId, applicant: userId });

        if (existingApplication) {
            return res.status(400).json({
                message: "You have already applied for this jobs",
                success: false
            });
        }

        // check if the jobs exists
        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({
                message: "Job not found",
                success: false
            })
        }
        // create a new application
        const newApplication = await Application.create({
            job:jobId,
            applicant:userId,
        });

        job.applications.push(newApplication._id);
        await job.save();
        return res.status(201).json({
            message:"Job applied successfully.",
            success:true
        })
    } catch (error) {
        console.log(error);
    }
};
export const getAppliedJobs = async (req,res) => {
    try {
        const userId = req.id;
        const application = await Application.find({applicant:userId}).sort({createdAt:-1}).populate({
            path:'job',
            options:{sort:{createdAt:-1}},
            populate:{
                path:'company',
                options:{sort:{createdAt:-1}},
            }
        });
        if(!application){
            return res.status(404).json({
                message:"No Applications",
                success:false
            })
        };
        return res.status(200).json({
            application,
            success:true
        })
    } catch (error) {
        console.log(error);
    }
}
// admin dekhega kitna user ne apply kiya hai
export const getApplicants = async (req,res) => {
    try {
        const jobId = req.params.id;
        const job = await Job.findById(jobId).populate({
            path:'applications',
            options:{sort:{createdAt:-1}},
            populate:{
                path:'applicant'
            }
        });
        if(!job){
            return res.status(404).json({
                message:'Job not found.',
                success:false
            })
        };
        return res.status(200).json({
            job, 
            succees:true
        });
    } catch (error) {
        console.log(error);
    }
}
export const updateStatus = async (req,res) => {
    try {
        const {status} = req.body;
        const applicationId = req.params.id;
        if(!status){
            return res.status(400).json({
                message:'status is required',
                success:false
            })
        };

        // find the application by applicantion id
        const application = await Application.findOne({_id:applicationId});
        if(!application){
            return res.status(404).json({
                message:"Application not found.",
                success:false
            })
        };

        // update the status
        application.status = status.toLowerCase();
        await application.save();

        return res.status(200).json({
            message:"Status updated successfully.",
            success:true
        });

    } catch (error) {
        console.log(error);
    }
}

export const getAcceptedApplications = async (req, res) => {
    try {
        const applications = await Application.find({ status: 'accepted' })
            .populate('applicant')
            .populate({
                path: 'job',
                populate: {
                    path: 'company',
                    model: 'Company'
                }
            });

        res.status(200).json({
            success: true,
            applications
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch accepted applications'
        });
    }
};

export const createCheckoutSession = async (req, res) => {
    try {
      const applicationId = req.params.applicationId;
  
      const application = await Application.findById(applicationId).populate('job');
  
      if (!application) {
        return res.status(404).json({ success: false, message: 'Application not found' });
      }
  
      const job = application.job;
  
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        line_items: [{
          price_data: {
            currency: 'inr',
            product_data: {
              name: `Salary for ${job.company.name}`,
              description: `Paying salary to ${application.applicant}`,
            },
            unit_amount: job.salary * 100,
          },
          quantity: 1,
        }],
        success_url: `${process.env.CLIENT_URL}/payment-success/${applicationId}`,
        cancel_url: `${process.env.CLIENT_URL}/payment-cancelled`,
      });
  
      res.status(200).json({ success: true, url: session.url });
    } catch (error) {
      console.error('Stripe Checkout error:', error);
      res.status(500).json({ success: false, message: 'Failed to create checkout session' });
    }
  };

  export const markAsPaid = async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ message: 'Application ID is required' });
    }

    try {
        const application = await Application.findById(id);
        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }

        application.paymentStatus = 'Paid';
        await application.save();

        return res.status(200).json({ message: 'Payment status updated successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error updating payment status' });
    }
};

// Add rating to an accepted application
export const rateApplication = async (req, res) => {
    try {
        const applicationId = req.params.id;
        const { score, review } = req.body; // Expecting a score (1-5) and an optional review

        if (!score || score < 1 || score > 5) {
            return res.status(400).json({
                message: 'Rating score should be between 1 and 5.',
                success: false
            });
        }

        // Find the application by ID
        const application = await Application.findById(applicationId);

        if (!application) {
            return res.status(404).json({
                message: 'Application not found.',
                success: false
            });
        }

        // Check if the application is accepted
        if (application.status !== 'accepted') {
            return res.status(400).json({
                message: 'Rating can only be given to accepted applications.',
                success: false
            });
        }

        // Update the rating
        application.rating.score = score;
        application.rating.review = review || ''; // Review is optional
        await application.save();

        return res.status(200).json({
            message: 'Rating added successfully.',
            success: true
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: 'An error occurred while adding the rating.',
            success: false
        });
    }
};

export const giveFeedbackToApplicant = async (req, res) => {
    try {
        const { feedback } = req.body;
        const applicationId = req.params.id;

        const application = await Application.findById(applicationId);
        if (!application) {
            return res.status(404).json({
                success: false,
                message: "Application not found."
            });
        }

        application.feedback = feedback;
        await application.save();

        res.status(200).json({
            success: true,
            message: "Feedback added successfully.",
            application
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to add feedback."
        });
    }
};
