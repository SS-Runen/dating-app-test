export default function OTPForm({otp, handleOTPChange, handleOTPKeyUp, loading, onVerify}: any) {
    return (
        // Modal OTP form
        <div className="modal-number-form">
        <div className="modal-number-form-content" style={{ height: "auto" }}>
            <form className="digit-group">
                <div className="form-group">
                    <label htmlFor="otp">OTP</label>
                </div>
                 {/* Individual input for 6 digits */}
                 <div style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: "20px" }}>
                    <input type="text" id="digit-1" name="digit-1" data-next="digit-2" maxLength={1} inputMode="numeric" value={otp?.[0] || ""} onChange={(e) => handleOTPChange(e)} onKeyUp={(e) => handleOTPKeyUp(e)} />
                    <input type="text" id="digit-2" name="digit-2" data-next="digit-3" data-previous="digit-1" maxLength={1} inputMode="numeric" value={otp?.[1] || ""} onChange={(e) => handleOTPChange(e)} onKeyUp={(e) => handleOTPKeyUp(e)} />
                    <input type="text" id="digit-3" name="digit-3" data-next="digit-4" data-previous="digit-2" maxLength={1} inputMode="numeric" value={otp?.[2] || ""} onChange={(e) => handleOTPChange(e)} onKeyUp={(e) => handleOTPKeyUp(e)} />
                    <input type="text" id="digit-4" name="digit-4" data-next="digit-5" data-previous="digit-3" maxLength={1} inputMode="numeric" value={otp?.[3] || ""} onChange={(e) => handleOTPChange(e)} onKeyUp={(e) => handleOTPKeyUp(e)} />
                    <input type="text" id="digit-5" name="digit-5" data-next="digit-6" data-previous="digit-4" maxLength={1} inputMode="numeric" value={otp?.[4] || ""} onChange={(e) => handleOTPChange(e)} onKeyUp={(e) => handleOTPKeyUp(e)} />
                    <input type="text" id="digit-6" name="digit-6" data-previous="digit-5" maxLength={1} inputMode="numeric" value={otp?.[5] || ""} onChange={(e) => handleOTPChange(e)} onKeyUp={(e) => handleOTPKeyUp(e)} />
                </div>
                
                <button className="btn btn-primary" type="button" style={{ width: "100%"}} onClick={() => onVerify()} disabled={loading || otp.length < 6}>{loading ? "Verifying OTP..." : "Verify"}</button>
            </form>
        </div>
    </div>
    )
}