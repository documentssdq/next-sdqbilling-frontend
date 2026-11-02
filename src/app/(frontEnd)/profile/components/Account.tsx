"use client";

import React, { useState, useEffect } from "react";
import { Icon as IconifyIcon } from "@iconify/react";
import { useSelector, useDispatch } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { fetchFrontendProfile, updateFrontendProfile, fetchFrontendGroups } from "@/redux/slices/frontEnd/userSlice";
import { Modal, Button, Form } from "react-bootstrap";
import Script from "next/script";
import { setting } from "@/context/useSettingsContext";
import { toast } from "react-hot-toast";


const Account = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, loading } = useSelector((state: RootState) => state.frontendUser);

  // Profile Form State
  const anyUserInit = user as any;
  const [profile, setProfile] = useState({
    name: anyUserInit?.name || anyUserInit?.firstName ? `${anyUserInit?.firstName || ''} ${anyUserInit?.lastName || ''}`.trim() : "",
    username: anyUserInit?.username || "",
    email: anyUserInit?.email || "",
    mobile: anyUserInit?.mobile || anyUserInit?.phone || "",
    sex: anyUserInit?.sex || "",
  });

  useEffect(() => {
    dispatch(fetchFrontendProfile());
    dispatch(fetchFrontendGroups());
  }, [dispatch]);

  useEffect(() => {
    if (user) {
      const anyUser = user as any;
      setProfile((prev) => ({
        ...prev,
        name: anyUser.name || (anyUser.firstName ? `${anyUser.firstName} ${anyUser.lastName || ''}`.trim() : prev.name),
        username: anyUser.username || prev.username,
        email: anyUser.email || prev.email,
        mobile: anyUser.mobile || anyUser.phone || prev.mobile,
        sex: anyUser.sex || prev.sex,
      }));
    }
  }, [user]);

  const [passwordState, setPasswordState] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState<string | null>(null);


  // Handlers
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveErrorMsg(null);
    setErrors({});
    try {
      await dispatch(updateFrontendProfile(profile)).unwrap();
      setSaveSuccessMsg("Account details updated successfully!");
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (err: any) {
      const msg = err.message || err || "Failed to update profile.";
      if (typeof msg === "string") {
        if (msg.toLowerCase().includes("email")) {
          setErrors((prev) => ({ ...prev, email: msg }));
        } else if (msg.toLowerCase().includes("mobile")) {
          setErrors((prev) => ({ ...prev, mobile: msg }));
        } else if (msg.toLowerCase().includes("username")) {
          setErrors((prev) => ({ ...prev, username: msg }));
        } else {
          setSaveErrorMsg(msg);
        }
      } else {
        setSaveErrorMsg("Failed to update profile.");
      }
      setTimeout(() => setSaveErrorMsg(null), 4000);
    }
  };


  return (
    <div className="tab-pane fade show active">
      {saveSuccessMsg && (
        <div className="alert alert-success d-flex align-items-center gap-2 mb-4" role="alert">
          <IconifyIcon icon="lucide:check-circle" width="20" />
          <div>{saveSuccessMsg}</div>
        </div>
      )}
      
      {saveErrorMsg && (
        <div className="alert alert-danger d-flex align-items-center gap-2 mb-4" role="alert">
          <IconifyIcon icon="lucide:alert-circle" width="20" />
          <div>{saveErrorMsg}</div>
        </div>
      )}

      <div className="row g-4">
        <div className="col-lg-8">
          <div className="account-content-card p-2 p-md-3 mb-4">
            <h4 className="card-header-title pb-3 mb-4 border-bottom">
              <IconifyIcon icon="lucide:user-cog" className="text-primary" />
              Personal & Professional Information
            </h4>

            <form onSubmit={handleProfileSubmit}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label font-weight-bold">
                    Full Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">
                    Username <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className={`form-control ${errors.username ? 'is-invalid' : ''}`}
                    value={profile.username}
                    onChange={(e) => {
                      setProfile({ ...profile, username: e.target.value });
                      if (errors.username) setErrors(prev => ({ ...prev, username: '' }));
                    }}
                    required
                  />
                  {errors.username && <div className="invalid-feedback">{errors.username}</div>}
                </div>

                <div className="col-md-6">
                  <label className="form-label">
                    Email Address <span className="text-danger">*</span>
                  </label>
                  <input
                    type="email"
                    className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                    value={profile.email}
                    onChange={(e) => {
                      setProfile({ ...profile, email: e.target.value });
                      if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                    }}
                    required
                  />
                  {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                </div>

                <div className="col-md-6">
                  <label className="form-label">
                    Mobile Number <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className={`form-control ${errors.mobile ? 'is-invalid' : ''}`}
                    value={profile.mobile}
                    onChange={(e) => {
                      setProfile({ ...profile, mobile: e.target.value });
                      if (errors.mobile) setErrors(prev => ({ ...prev, mobile: '' }));
                    }}
                    required
                  />
                  {errors.mobile && <div className="invalid-feedback">{errors.mobile}</div>}
                </div>


                <div className="col-md-6">
                  <label className="form-label">Gender <span className="text-danger">*</span></label>
                  <div className="d-flex gap-4 mt-2">
                    <div className="form-check d-flex align-items-center gap-2">
                      <input
                        className="form-check-input mt-0"
                        type="radio"
                        name="sex"
                        id="sexMale"
                        value="Male"
                        checked={profile.sex === "Male"}
                        onChange={(e) => setProfile({ ...profile, sex: e.target.value })}
                        required
                      />
                      <label className="form-check-label mb-0" htmlFor="sexMale">
                        Male
                      </label>
                    </div>
                    <div className="form-check d-flex align-items-center gap-2">
                      <input
                        className="form-check-input mt-0"
                        type="radio"
                        name="sex"
                        id="sexFemale"
                        value="Female"
                        checked={profile.sex === "Female"}
                        onChange={(e) => setProfile({ ...profile, sex: e.target.value })}
                        required
                      />
                      <label className="form-check-label mb-0" htmlFor="sexFemale">
                        Female
                      </label>
                    </div>
                  </div>
                </div>

                <div className="col-12 mt-4 pt-2">
                  <button type="submit" className="btn btn-primary px-4 py-2 fw-semibold" disabled={loading}>
                    {loading ? (
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    ) : (
                      <IconifyIcon icon="lucide:save" className="me-2" />
                    )}
                    {loading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Password & Account Security Sidebar */}
        <div className="col-lg-4">
          {/* <div className="account-content-card p-4 mb-4">
            <h4 className="card-header-title pb-3 mb-4 border-bottom">
              <IconifyIcon icon="lucide:lock" className="text-primary" />
              Security & Password
            </h4>

            {passwordSuccessMsg && (
              <div className="alert alert-success d-flex align-items-center gap-2 mb-3" role="alert">
                <IconifyIcon icon="lucide:check-circle" width="18" />
                <div className="small">{passwordSuccessMsg}</div>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit}>
              <div className="mb-3">
                <label className="form-label">Current Password</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="••••••••"
                  value={passwordState.currentPassword}
                  onChange={(e) => setPasswordState({ ...passwordState, currentPassword: e.target.value })}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="••••••••"
                  value={passwordState.newPassword}
                  onChange={(e) => setPasswordState({ ...passwordState, newPassword: e.target.value })}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="form-label">Confirm New Password</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="••••••••"
                  value={passwordState.confirmPassword}
                  onChange={(e) => setPasswordState({ ...passwordState, confirmPassword: e.target.value })}
                  required
                />
              </div>

              <button type="submit" className="btn btn-outline-primary w-100 py-2 fw-semibold">
                <IconifyIcon icon="lucide:key-round" className="me-2" /> Update Password
              </button>
            </form>
          </div> */}

          

          
          {!user?.memberId && (
          <div className="card border-0 bg-primary bg-opacity-10 text-primary p-4 rounded-3 mb-4">
            <div className="d-flex align-items-start gap-3">
              <IconifyIcon icon="lucide:help-circle" width="28" className="flex-shrink-0 mt-1" />
              <div>
                <h6 className="fw-bold mb-1">Need help updating your profile?</h6>
                <p className="small mb-0 text-secondary">
                  For any updates to your Medical Registration Number or Life Membership certificate details, please contact the Secretariat.
                </p>
              </div>
            </div>
          </div>
          )}
        </div>
      </div>
    

    </div>

  );
};

export default Account;
