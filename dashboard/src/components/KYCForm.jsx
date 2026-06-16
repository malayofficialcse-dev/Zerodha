import React, { useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config/config.js";
import "./KYCForm.css";

const KYCForm = ({ onKycSubmitted }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: "",
    dob: "",
    phone: "",
    pan: "",
    aadhaar: "",
    bankName: "",
    accountNumber: "",
    ifsc: "",
    address: ""
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const nextStep = () => {
    if (step === 1 && (!formData.fullName || !formData.dob || !formData.phone)) {
      setError("Please fill all fields in this step.");
      return;
    }
    if (step === 2 && (!formData.pan || !formData.aadhaar)) {
      setError("Please fill all fields in this step.");
      return;
    }
    if (step === 3 && (!formData.bankName || !formData.accountNumber || !formData.ifsc || !formData.address)) {
      setError("Please fill all fields in this step.");
      return;
    }
    setError("");
    setStep(step + 1);
  };

  const prevStep = () => {
    setError("");
    setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_BASE_URL}/user/kyc`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (onKycSubmitted) {
        onKycSubmitted();
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to submit KYC. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="kyc-form-container">
      <div className="kyc-card">
        <div className="kyc-header">
          <h2>Onboarding document verification</h2>
          <p>Complete your profile to unlock a virtual trading account of ₹1,000</p>
        </div>

        <div className="kyc-progress-bar">
          <div className={`progress-step ${step >= 1 ? "active" : ""}`}>1. Personal</div>
          <div className="progress-line"></div>
          <div className={`progress-step ${step >= 2 ? "active" : ""}`}>2. Identity</div>
          <div className="progress-line"></div>
          <div className={`progress-step ${step >= 3 ? "active" : ""}`}>3. Bank</div>
          <div className="progress-line"></div>
          <div className={`progress-step ${step >= 4 ? "active" : ""}`}>4. Review</div>
        </div>

        {error && <div className="kyc-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {step === 1 && (
            <div className="kyc-step-content">
              <h3>Personal details</h3>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Enter your legal name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Date of Birth</label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="10-digit mobile number"
                  required
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="kyc-step-content">
              <h3>Identity details</h3>
              <div className="form-group">
                <label>PAN Card Number</label>
                <input
                  type="text"
                  name="pan"
                  value={formData.pan}
                  onChange={handleChange}
                  placeholder="ABCDE1234F"
                  style={{ textTransform: "uppercase" }}
                  required
                />
              </div>
              <div className="form-group">
                <label>Aadhaar Number</label>
                <input
                  type="text"
                  name="aadhaar"
                  value={formData.aadhaar}
                  onChange={handleChange}
                  placeholder="12-digit Aadhaar number"
                  maxLength="12"
                  required
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="kyc-step-content">
              <h3>Bank details</h3>
              <div className="form-group">
                <label>Bank Name</label>
                <input
                  type="text"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleChange}
                  placeholder="e.g., State Bank of India"
                  required
                />
              </div>
              <div className="form-group">
                <label>Account Number</label>
                <input
                  type="text"
                  name="accountNumber"
                  value={formData.accountNumber}
                  onChange={handleChange}
                  placeholder="Enter account number"
                  required
                />
              </div>
              <div className="form-group">
                <label>IFSC Code</label>
                <input
                  type="text"
                  name="ifsc"
                  value={formData.ifsc}
                  onChange={handleChange}
                  placeholder="SBIN0001234"
                  style={{ textTransform: "uppercase" }}
                  required
                />
              </div>
              <div className="form-group">
                <label>Residential Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter your complete address"
                  required
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="kyc-step-content review-step">
              <h3>Review your details</h3>
              <div className="review-grid">
                <div><strong>Full Name:</strong> {formData.fullName}</div>
                <div><strong>Date of Birth:</strong> {formData.dob}</div>
                <div><strong>Phone:</strong> {formData.phone}</div>
                <div><strong>PAN Card:</strong> {formData.pan.toUpperCase()}</div>
                <div><strong>Aadhaar:</strong> {formData.aadhaar}</div>
                <div><strong>Bank Name:</strong> {formData.bankName}</div>
                <div><strong>Account Number:</strong> {formData.accountNumber}</div>
                <div><strong>IFSC Code:</strong> {formData.ifsc.toUpperCase()}</div>
                <div className="full-width"><strong>Address:</strong> {formData.address}</div>
              </div>
              <div className="kyc-notice">
                <p>⚠️ By clicking Submit, you certify that all information given above is accurate and belongs to you. This profile will be sent to the administrator for verification.</p>
              </div>
            </div>
          )}

          <div className="kyc-actions">
            {step > 1 && (
              <button type="button" className="kyc-btn secondary" onClick={prevStep}>
                Back
              </button>
            )}
            {step < 4 ? (
              <button type="button" className="kyc-btn primary" onClick={nextStep}>
                Continue
              </button>
            ) : (
              <button type="submit" className="kyc-btn primary trigger-btn" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit KYC"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default KYCForm;
