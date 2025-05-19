import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { applyJob, getApplicants, getAppliedJobs, updateStatus,rateApplication } from "../controllers/application.controller.js";
import { getAcceptedApplications } from '../controllers/application.controller.js';
import { createCheckoutSession,markAsPaid , giveFeedbackToApplicant} from '../controllers/application.controller.js';


const router = express.Router();

router.route("/apply/:id").get(isAuthenticated, applyJob);
router.route("/get").get(isAuthenticated, getAppliedJobs);
router.route("/:id/applicants").get(isAuthenticated, getApplicants);
router.route("/status/:id/update").post(isAuthenticated, updateStatus);
router.route('/applications/accepted').get(isAuthenticated, getAcceptedApplications);
router.route('/create-checkout-session/:applicationId').post(isAuthenticated,createCheckoutSession);
router.route('/applications/mark-paid/:id').put(markAsPaid);
router.route('/rate/:id').post(isAuthenticated, rateApplication);
router.route('/feedback-to-applicant/:id').post(isAuthenticated, giveFeedbackToApplicant);
router.route('/feedback-to-applicant/:id').get(giveFeedbackToApplicant);

 
export default router;

