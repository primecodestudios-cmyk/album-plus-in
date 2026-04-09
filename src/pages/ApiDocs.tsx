import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowLeft, Send, Copy, Check, ChevronDown, ChevronRight, Code2, FileJson,
  Zap, Shield, Server, BookOpen, Monitor, Key, Activity, CreditCard,
  Smartphone, AlertTriangle, Clock, Users, HardDrive, RefreshCw, Terminal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import alplumLogo from "@/assets/alplum-plus-logo.png";

const BASE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/* ─── Endpoint Definitions ───────────────────────────────────── */

interface Param {
  type: string;
  required: boolean;
  description: string;
  example: string;
}

interface ApiEndpoint {
  id: string;
  name: string;
  method: "GET" | "POST";
  path: string;
  description: string;
  category: string;
  notes?: string[];
  requestBody?: Record<string, Param>;
  queryParams?: Record<string, Param>;
  sampleRequest?: object;
  sampleResponse: object;
  sampleErrorResponse?: object;
  statusCodes?: { code: number; meaning: string }[];
}

const endpoints: ApiEndpoint[] = [
  {
    id: "register",
    name: "Register User",
    method: "POST",
    path: "/software-register",
    description: "Register a new user from the desktop software. Creates an account and submits a device activation request. The user status will be PENDING until an admin manually activates or a payment auto-activates the license.",
    category: "Authentication",
    notes: [
      "If the WhatsApp number already exists, a new device request is created for the existing user.",
      "Email is auto-generated as {phone}@alplumplus.app — users don't need a real email.",
      "Password must be ≥ 8 characters with both letters and numbers.",
    ],
    requestBody: {
      whatsapp_number: { type: "string", required: true, description: "10-digit WhatsApp number (digits only)", example: "9876543210" },
      country_code: { type: "string", required: false, description: "Country dialing code (default: +91)", example: "+91" },
      studio_name: { type: "string", required: true, description: "Studio or business name", example: "Raj Photography" },
      city: { type: "string", required: true, description: "City name", example: "Chennai" },
      state: { type: "string", required: true, description: "State name", example: "Tamil Nadu" },
      country: { type: "string", required: false, description: "Country name (default: India)", example: "India" },
      languages: { type: "string[]", required: false, description: "Array of preferred languages", example: '["Tamil","English"]' },
      password: { type: "string", required: true, description: "Account password (min 8 chars, letters+numbers)", example: "MyPass123" },
      device_id: { type: "string", required: true, description: "Hardware-based device fingerprint (see Device ID section)", example: "DEV-A1B2C3D4" },
      device_name: { type: "string", required: false, description: "Computer name (Environment.MachineName)", example: "DESKTOP-RAJ" },
      os: { type: "string", required: false, description: "Windows version string", example: "Windows 11 Pro" },
      software_version: { type: "string", required: false, description: "Current software version", example: "v5.2.1" },
    },
    sampleRequest: {
      whatsapp_number: "9876543210",
      country_code: "+91",
      studio_name: "Raj Photography",
      city: "Chennai",
      state: "Tamil Nadu",
      country: "India",
      languages: ["Tamil", "English"],
      password: "MyPass123",
      device_id: "DEV-A1B2C3D4",
      device_name: "DESKTOP-RAJ",
      os: "Windows 11 Pro",
      software_version: "v5.2.1",
    },
    sampleResponse: {
      status: "success",
      message: "Registration Successful. Waiting for Activation.",
      user_id: "550e8400-e29b-41d4-a716-446655440000",
      user_status: "pending",
    },
    sampleErrorResponse: {
      status: "error",
      message: "Indian WhatsApp number must be exactly 10 digits; Password must include numbers",
    },
    statusCodes: [
      { code: 200, meaning: "Registration successful or user already exists" },
      { code: 400, meaning: "Validation failed — check message field" },
      { code: 500, meaning: "Internal server error" },
    ],
  },
  {
    id: "check-license",
    name: "Verify License",
    method: "POST",
    path: "/check-license",
    description: "Primary endpoint for license validation. Software MUST call this on every startup and periodically (every 5-10 minutes). Returns real-time license status, expiry info, and device limit enforcement.",
    category: "License",
    notes: [
      "Call this on every software startup — this is your main sync endpoint.",
      "If status is 'device_limit_reached', show the user their active devices and let them deactivate one.",
      "The device is automatically registered/updated in the devices table on each call.",
      "Use server-returned expiry_date — never rely on local/cached dates.",
    ],
    requestBody: {
      email: { type: "string", required: true, description: "User email ({phone}@alplumplus.app)", example: "9876543210@alplumplus.app" },
      device_id: { type: "string", required: true, description: "Hardware device fingerprint", example: "DEV-A1B2C3D4" },
      software_version: { type: "string", required: false, description: "Current software version", example: "v5.2.1" },
    },
    sampleRequest: {
      email: "9876543210@alplumplus.app",
      device_id: "DEV-A1B2C3D4",
      software_version: "v5.2.1",
    },
    sampleResponse: {
      success: true,
      status: "active",
      plan_name: "Professional",
      expiry_date: "2027-03-15T00:00:00Z",
      activation_date: "2026-03-15T00:00:00Z",
      remaining_days: 365,
      max_devices: 2,
      active_device_count: 1,
    },
    sampleErrorResponse: {
      success: true,
      status: "device_limit_reached",
      message: "You have reached your device limit (2 PCs). Please deactivate an existing device first.",
      max_devices: 2,
      active_device_count: 2,
      active_devices: [
        { device_id: "DEV-A1B2C3D4", device_name: "DESKTOP-RAJ", last_seen: "2026-04-09T10:00:00Z" },
        { device_id: "DEV-X9Y8Z7W6", device_name: "LAPTOP-RAJ", last_seen: "2026-04-08T15:30:00Z" },
      ],
    },
    statusCodes: [
      { code: 200, meaning: "Status returned — check 'status' field for active/expired/blocked/pending/device_limit_reached" },
      { code: 400, meaning: "Missing email or device_id" },
      { code: 404, meaning: "User not registered" },
    ],
  },
  {
    id: "user-status",
    name: "User Status",
    method: "POST",
    path: "/user-status",
    description: "Get user's overall activation status. Supports both GET (query params) and POST (JSON body). Use for polling activation status after registration.",
    category: "Authentication",
    notes: [
      "Also supports GET with query params: ?user_id=xxx&device_id=xxx",
      "Use this for polling after registration to check if admin has activated the account.",
    ],
    requestBody: {
      user_id: { type: "string", required: true, description: "User UUID returned during registration", example: "550e8400-e29b-41d4-a716-446655440000" },
      device_id: { type: "string", required: false, description: "Device ID for specific device check", example: "DEV-A1B2C3D4" },
    },
    sampleRequest: {
      user_id: "550e8400-e29b-41d4-a716-446655440000",
      device_id: "DEV-A1B2C3D4",
    },
    sampleResponse: {
      status: "active",
      message: "License is active",
      plan_name: "Professional",
      expires_at: "2027-03-15T00:00:00Z",
      remaining_days: 365,
    },
    statusCodes: [
      { code: 200, meaning: "Status returned — values: active / expired / blocked / pending / not_found" },
      { code: 400, meaning: "Missing user_id" },
    ],
  },
  {
    id: "device-request",
    name: "Device Activation Request",
    method: "POST",
    path: "/device-request",
    description: "Submit a new device for admin approval. Used when a user installs software on a new PC and wants to activate it.",
    category: "Device",
    notes: [
      "If a pending request already exists for this device, the existing request ID is returned.",
      "If the device already has an active license, status 'active' is returned immediately.",
    ],
    requestBody: {
      email: { type: "string", required: true, description: "User email", example: "9876543210@alplumplus.app" },
      device_id: { type: "string", required: true, description: "New device fingerprint", example: "DEV-E5F6G7H8" },
      system_name: { type: "string", required: false, description: "Computer name", example: "LAPTOP-RAJ" },
      windows_version: { type: "string", required: false, description: "OS version info", example: "Windows 10 Pro 22H2" },
      software_version: { type: "string", required: false, description: "Software version", example: "v5.2.1" },
      ip_address: { type: "string", required: false, description: "Client IP address", example: "192.168.1.10" },
    },
    sampleRequest: {
      email: "9876543210@alplumplus.app",
      device_id: "DEV-E5F6G7H8",
      system_name: "LAPTOP-RAJ",
      windows_version: "Windows 10 Pro 22H2",
      software_version: "v5.2.1",
      ip_address: "192.168.1.10",
    },
    sampleResponse: {
      success: true,
      message: "Activation request submitted. Waiting for admin approval.",
      request_id: "550e8400-e29b-41d4-a716-446655440000",
    },
    statusCodes: [
      { code: 200, meaning: "Request submitted or already active" },
      { code: 400, meaning: "Missing email or device_id" },
      { code: 404, meaning: "User not found" },
    ],
  },
  {
    id: "device-list",
    name: "Device List",
    method: "POST",
    path: "/device-list",
    description: "Get all devices registered to a user with license info, device limits, and activation status. Use to show device management UI in software.",
    category: "Device",
    notes: [
      "Also supports GET with query params: ?user_id=xxx or ?email=xxx",
      "can_add_device is true when active_device_count < max_devices.",
      "Show this data in a device management panel within your software.",
    ],
    requestBody: {
      user_id: { type: "string", required: false, description: "User UUID (provide either user_id or email)", example: "550e8400-e29b-41d4-a716-446655440000" },
      email: { type: "string", required: false, description: "User email (alternative to user_id)", example: "9876543210@alplumplus.app" },
    },
    sampleRequest: {
      email: "9876543210@alplumplus.app",
    },
    sampleResponse: {
      success: true,
      user_id: "550e8400-e29b-41d4-a716-446655440000",
      license: {
        plan_name: "Professional",
        max_devices: 2,
        starts_at: "2026-03-15T00:00:00Z",
        expires_at: "2027-03-15T00:00:00Z",
        remaining_days: 365,
      },
      active_device_count: 1,
      max_devices: 2,
      can_add_device: true,
      devices: [
        {
          device_id: "DEV-A1B2C3D4",
          device_name: "DESKTOP-RAJ",
          is_active: true,
          last_seen_at: "2026-04-09T10:00:00Z",
          activated_at: "2026-03-15T00:00:00Z",
          system_info: "v5.2.1",
          ip_address: "192.168.1.10",
          running_version: "v5.2.1",
          windows_version: "Windows 11 Pro",
        },
      ],
    },
    statusCodes: [
      { code: 200, meaning: "Device list returned" },
      { code: 400, meaning: "Missing user_id and email" },
    ],
  },
  {
    id: "deactivate-device",
    name: "Deactivate Device",
    method: "POST",
    path: "/deactivate-device",
    description: "Deactivate a specific device to free up a license slot. Can be called from the software or the website. After deactivation, the user can activate a new device.",
    category: "Device",
    notes: [
      "After deactivation, call /device-list to refresh the device panel.",
      "Deactivated devices remain in history but don't count toward the limit.",
      "Users can also deactivate devices from their web dashboard.",
    ],
    requestBody: {
      email: { type: "string", required: false, description: "User email (provide either email or user_id)", example: "9876543210@alplumplus.app" },
      user_id: { type: "string", required: false, description: "User UUID (alternative to email)", example: "550e8400-e29b-41d4-a716-446655440000" },
      device_id: { type: "string", required: true, description: "Device ID to deactivate", example: "DEV-A1B2C3D4" },
    },
    sampleRequest: {
      email: "9876543210@alplumplus.app",
      device_id: "DEV-A1B2C3D4",
    },
    sampleResponse: {
      success: true,
      message: "Device deactivated successfully",
      device_id: "DEV-A1B2C3D4",
      device_name: "DESKTOP-RAJ",
    },
    sampleErrorResponse: {
      success: false,
      error: "No active device found with this ID",
    },
    statusCodes: [
      { code: 200, meaning: "Device deactivated" },
      { code: 404, meaning: "Device or user not found" },
    ],
  },
  {
    id: "payment-verify",
    name: "Payment Verify & Auto-Activate",
    method: "POST",
    path: "/payment-verify",
    description: "Verify a payment and automatically create + activate a license. Called by your payment gateway callback (Razorpay, PhonePe, etc). Matches user by email or phone number.",
    category: "License",
    notes: [
      "User is matched by email OR phone — provide at least one.",
      "License key is auto-generated in ALPM-XXXX-XXXX-XXXX format.",
      "If device_id is provided, the device is also auto-activated.",
      "A purchase record is created for billing history.",
      "This endpoint replaces manual admin activation for paid users.",
    ],
    requestBody: {
      email: { type: "string", required: false, description: "User email (provide email or phone)", example: "9876543210@alplumplus.app" },
      phone: { type: "string", required: false, description: "User phone with country code", example: "+919876543210" },
      payment_id: { type: "string", required: true, description: "Payment gateway transaction ID", example: "pay_Lx7K3qBM9ZqPRk" },
      amount: { type: "number", required: false, description: "Payment amount in INR", example: "2999" },
      plan_name: { type: "string", required: true, description: "Plan name to activate", example: "Professional" },
      duration_days: { type: "number", required: true, description: "License duration in days", example: "365" },
      max_pcs: { type: "number", required: false, description: "Max devices allowed (default: 1)", example: "2" },
      device_id: { type: "string", required: false, description: "Device to auto-activate immediately", example: "DEV-A1B2C3D4" },
    },
    sampleRequest: {
      email: "9876543210@alplumplus.app",
      payment_id: "pay_Lx7K3qBM9ZqPRk",
      amount: 2999,
      plan_name: "Professional",
      duration_days: 365,
      max_pcs: 2,
      device_id: "DEV-A1B2C3D4",
    },
    sampleResponse: {
      success: true,
      message: "Payment verified and license activated",
      license: {
        id: "550e8400-e29b-41d4-a716-446655440000",
        license_key: "ALPM-AB2C-D3EF-GH4J",
        plan_name: "Professional",
        starts_at: "2026-04-09T00:00:00Z",
        expires_at: "2027-04-09T00:00:00Z",
        max_devices: 2,
        remaining_days: 365,
      },
    },
    statusCodes: [
      { code: 200, meaning: "License activated" },
      { code: 400, meaning: "Missing required fields" },
      { code: 404, meaning: "User not found" },
    ],
  },
];

const categories = ["All", ...Array.from(new Set(endpoints.map((e) => e.category)))];

/* ─── VB.NET / C# Code Samples ────────────────────────────── */

const vbNetHelperCode = `' ═══════════════════════════════════════════════
' AlplumPlus API Helper Class (VB.NET)
' ═══════════════════════════════════════════════

Imports System.Net.Http
Imports System.Text
Imports Newtonsoft.Json
Imports Newtonsoft.Json.Linq

Public Class AlplumPlusAPI

    Private Shared ReadOnly API_BASE As String = "${BASE_URL}"
    Private Shared ReadOnly API_KEY As String = "YOUR_ANON_KEY"
    Private Shared client As New HttpClient()

    ''' <summary>
    ''' Send POST request to API
    ''' </summary>
    Public Shared Async Function PostAsync(endpoint As String, data As Object) As Task(Of JObject)
        Try
            Dim json As String = JsonConvert.SerializeObject(data)
            Dim content As New StringContent(json, Encoding.UTF8, "application/json")
            
            client.DefaultRequestHeaders.Clear()
            client.DefaultRequestHeaders.Add("apikey", API_KEY)
            
            Dim response = Await client.PostAsync(API_BASE & endpoint, content)
            Dim responseBody = Await response.Content.ReadAsStringAsync()
            
            Return JObject.Parse(responseBody)
        Catch ex As Exception
            Return JObject.Parse("{\\"error\\": \\"" & ex.Message & "\\"}")
        End Try
    End Function

    ''' <summary>
    ''' Generate hardware-based Device ID
    ''' </summary>
    Public Shared Function GetDeviceId() As String
        Dim cpuId As String = ""
        Dim hddId As String = ""
        Dim macAddr As String = ""
        
        ' CPU ID
        Using searcher As New Management.ManagementObjectSearcher(
            "SELECT ProcessorId FROM Win32_Processor")
            For Each item In searcher.Get()
                cpuId = item("ProcessorId")?.ToString()
                Exit For
            Next
        End Using
        
        ' HDD Serial
        Using searcher As New Management.ManagementObjectSearcher(
            "SELECT SerialNumber FROM Win32_DiskDrive WHERE Index=0")
            For Each item In searcher.Get()
                hddId = item("SerialNumber")?.ToString()?.Trim()
                Exit For
            Next
        End Using
        
        ' MAC Address
        Using searcher As New Management.ManagementObjectSearcher(
            "SELECT MACAddress FROM Win32_NetworkAdapterConfiguration WHERE IPEnabled=True")
            For Each item In searcher.Get()
                macAddr = item("MACAddress")?.ToString()
                Exit For
            Next
        End Using
        
        ' Hash all components
        Dim combined As String = cpuId & "|" & hddId & "|" & macAddr
        Using md5 = Security.Cryptography.MD5.Create()
            Dim hash = md5.ComputeHash(Encoding.UTF8.GetBytes(combined))
            Dim hex = BitConverter.ToString(hash).Replace("-", "").Substring(0, 8)
            Return "DEV-" & hex
        End Using
    End Function
    
    ''' <summary>
    ''' Get Windows version string
    ''' </summary>
    Public Shared Function GetWindowsVersion() As String
        Return Environment.OSVersion.VersionString & " " & 
               If(Environment.Is64BitOperatingSystem, "64-bit", "32-bit")
    End Function

End Class`;

const vbNetStartupCode = `' ═══════════════════════════════════════════════
' SOFTWARE STARTUP - License Check Flow
' ═══════════════════════════════════════════════

Private Async Sub Form_Load(sender As Object, e As EventArgs) Handles MyBase.Load
    
    Dim deviceId As String = AlplumPlusAPI.GetDeviceId()
    Dim email As String = savedPhoneNumber & "@alplumplus.app"
    
    ' ── Step 1: Check License ──────────────────
    Dim result = Await AlplumPlusAPI.PostAsync("/check-license", New With {
        .email = email,
        .device_id = deviceId,
        .software_version = Application.ProductVersion
    })
    
    Dim status As String = result("status")?.ToString()
    
    Select Case status
    
        Case "active"
            ' ✅ Software is licensed
            Dim remainingDays = CInt(result("remaining_days"))
            Dim expiryDate = result("expiry_date")?.ToString()
            Dim planName = result("plan_name")?.ToString()
            
            lblStatus.Text = $"Plan: {planName} | Expires: {expiryDate}"
            
            ' Show warning if expiring soon
            If remainingDays <= 7 Then
                MessageBox.Show(
                    $"Your license expires in {remainingDays} days!" & vbCrLf &
                    "Please renew to avoid interruption.",
                    "License Expiring Soon",
                    MessageBoxButtons.OK, MessageBoxIcon.Warning)
            End If
            
        Case "expired"
            ' ❌ License expired — block software
            MessageBox.Show(
                "Your license has expired." & vbCrLf &
                "Please renew your subscription to continue.",
                "License Expired",
                MessageBoxButtons.OK, MessageBoxIcon.Stop)
            ShowRenewalDialog()
            Me.Close()
            
        Case "blocked"
            ' 🚫 Account blocked by admin
            MessageBox.Show(
                "Your account has been blocked." & vbCrLf &
                "Please contact support for assistance.",
                "Account Blocked",
                MessageBoxButtons.OK, MessageBoxIcon.Error)
            Me.Close()
            
        Case "device_limit_reached"
            ' ⚠️ Too many devices
            Dim maxDevices = CInt(result("max_devices"))
            Dim devices = result("active_devices")
            
            Dim deviceList As String = ""
            For Each dev In devices
                deviceList &= $"  • {dev("device_name")} (Last: {dev("last_seen")})" & vbCrLf
            Next
            
            Dim choice = MessageBox.Show(
                $"You have reached your device limit ({maxDevices} PCs)." & vbCrLf &
                vbCrLf & "Active Devices:" & vbCrLf & deviceList & vbCrLf &
                "Would you like to deactivate a device?",
                "Device Limit Reached",
                MessageBoxButtons.YesNo, MessageBoxIcon.Warning)
            
            If choice = DialogResult.Yes Then
                ShowDeviceManagementDialog(devices)
            Else
                Me.Close()
            End If
            
        Case "pending"
            ' ⏳ Waiting for activation
            MessageBox.Show(
                "Your account is pending activation." & vbCrLf &
                "An admin will activate your license shortly.",
                "Pending Activation",
                MessageBoxButtons.OK, MessageBoxIcon.Information)
            Me.Close()
            
        Case "no_license"
            ' 🆕 No license found
            ShowRegistrationDialog()
            
        Case Else
            MessageBox.Show("Unable to verify license. Please try again.",
                "Connection Error", MessageBoxButtons.OK, MessageBoxIcon.Warning)
    End Select
    
End Sub`;

const vbNetRegisterCode = `' ═══════════════════════════════════════════════
' USER REGISTRATION
' ═══════════════════════════════════════════════

Private Async Sub btnRegister_Click(sender As Object, e As EventArgs)
    
    btnRegister.Enabled = False
    lblStatus.Text = "Registering..."
    
    Dim result = Await AlplumPlusAPI.PostAsync("/software-register", New With {
        .whatsapp_number = txtPhone.Text.Trim(),
        .country_code = "+91",
        .studio_name = txtStudioName.Text.Trim(),
        .city = txtCity.Text.Trim(),
        .state = cboState.SelectedItem?.ToString(),
        .country = "India",
        .languages = GetSelectedLanguages(),
        .password = txtPassword.Text,
        .device_id = AlplumPlusAPI.GetDeviceId(),
        .device_name = Environment.MachineName,
        .os = AlplumPlusAPI.GetWindowsVersion(),
        .software_version = Application.ProductVersion
    })
    
    If result("status")?.ToString() = "success" Then
        ' Save user_id locally for polling
        My.Settings.UserId = result("user_id")?.ToString()
        My.Settings.UserEmail = txtPhone.Text.Trim() & "@alplumplus.app"
        My.Settings.Save()
        
        MessageBox.Show(
            "Registration successful!" & vbCrLf &
            "Your account will be activated by admin shortly." & vbCrLf &
            "You will be notified via WhatsApp.",
            "Success", MessageBoxButtons.OK, MessageBoxIcon.Information)
            
        ' Start polling for activation
        StartActivationPolling()
    Else
        MessageBox.Show(
            "Registration failed: " & result("message")?.ToString(),
            "Error", MessageBoxButtons.OK, MessageBoxIcon.Error)
    End If
    
    btnRegister.Enabled = True
End Sub

' ── Poll for activation every 30 seconds ──────
Private Async Sub StartActivationPolling()
    While True
        Await Task.Delay(30000) ' 30 seconds
        
        Dim result = Await AlplumPlusAPI.PostAsync("/user-status", New With {
            .user_id = My.Settings.UserId,
            .device_id = AlplumPlusAPI.GetDeviceId()
        })
        
        Dim status = result("status")?.ToString()
        
        If status = "active" Then
            MessageBox.Show("Your license has been activated!",
                "Activated", MessageBoxButtons.OK, MessageBoxIcon.Information)
            Me.Close() ' Restart the main form
            Exit While
        ElseIf status = "rejected" Then
            MessageBox.Show("Your activation request was rejected.",
                "Rejected", MessageBoxButtons.OK, MessageBoxIcon.Error)
            Exit While
        End If
    End While
End Sub`;

const vbNetDeviceCode = `' ═══════════════════════════════════════════════
' DEVICE MANAGEMENT
' ═══════════════════════════════════════════════

' ── Get Device List ────────────────────────────
Private Async Sub LoadDeviceList()
    
    Dim result = Await AlplumPlusAPI.PostAsync("/device-list", New With {
        .email = My.Settings.UserEmail
    })
    
    If result("success")?.ToObject(Of Boolean)() Then
        Dim license = result("license")
        Dim devices = result("devices")
        
        ' Update UI
        lblPlan.Text = license?("plan_name")?.ToString()
        lblMaxDevices.Text = $"{result("active_device_count")}/{result("max_devices")}"
        lblExpiry.Text = license?("expires_at")?.ToString()
        lblRemaining.Text = $"{license?("remaining_days")} days"
        
        ' Populate device grid
        dgvDevices.Rows.Clear()
        For Each dev In devices
            dgvDevices.Rows.Add(
                dev("device_id")?.ToString(),
                dev("device_name")?.ToString(),
                If(dev("is_active")?.ToObject(Of Boolean)(), "Active", "Inactive"),
                dev("last_seen_at")?.ToString(),
                dev("windows_version")?.ToString()
            )
        Next
    End If
End Sub

' ── Deactivate a Device ────────────────────────
Private Async Sub btnDeactivate_Click(sender As Object, e As EventArgs)
    
    If dgvDevices.SelectedRows.Count = 0 Then
        MessageBox.Show("Please select a device to deactivate.")
        Return
    End If
    
    Dim deviceId = dgvDevices.SelectedRows(0).Cells("DeviceId").Value?.ToString()
    Dim deviceName = dgvDevices.SelectedRows(0).Cells("DeviceName").Value?.ToString()
    
    Dim confirm = MessageBox.Show(
        $"Are you sure you want to deactivate '{deviceName}'?" & vbCrLf &
        "This will free up a device slot.",
        "Confirm Deactivation",
        MessageBoxButtons.YesNo, MessageBoxIcon.Question)
    
    If confirm = DialogResult.Yes Then
        Dim result = Await AlplumPlusAPI.PostAsync("/deactivate-device", New With {
            .email = My.Settings.UserEmail,
            .device_id = deviceId
        })
        
        If result("success")?.ToObject(Of Boolean)() Then
            MessageBox.Show("Device deactivated successfully!",
                "Success", MessageBoxButtons.OK, MessageBoxIcon.Information)
            LoadDeviceList() ' Refresh
        Else
            MessageBox.Show("Error: " & result("error")?.ToString())
        End If
    End If
End Sub`;

const csharpHelperCode = `// ═══════════════════════════════════════════════
// AlplumPlus API Helper Class (C#)
// ═══════════════════════════════════════════════

using System.Net.Http;
using System.Text;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Management;
using System.Security.Cryptography;

public static class AlplumPlusAPI
{
    private const string API_BASE = "${BASE_URL}";
    private const string API_KEY = "YOUR_ANON_KEY";
    private static readonly HttpClient client = new HttpClient();

    /// <summary>
    /// Send POST request to API
    /// </summary>
    public static async Task<JObject> PostAsync(string endpoint, object data)
    {
        try
        {
            var json = JsonConvert.SerializeObject(data);
            var content = new StringContent(json, Encoding.UTF8, "application/json");
            
            client.DefaultRequestHeaders.Remove("apikey");
            client.DefaultRequestHeaders.Add("apikey", API_KEY);
            
            var response = await client.PostAsync(API_BASE + endpoint, content);
            var body = await response.Content.ReadAsStringAsync();
            
            return JObject.Parse(body);
        }
        catch (Exception ex)
        {
            return JObject.Parse($"{{\\"error\\": \\"{ex.Message}\\"}}");
        }
    }

    /// <summary>
    /// Generate hardware-based Device ID
    /// </summary>
    public static string GetDeviceId()
    {
        string cpuId = "", hddId = "", macAddr = "";

        using (var s = new ManagementObjectSearcher(
            "SELECT ProcessorId FROM Win32_Processor"))
            foreach (var o in s.Get()) { cpuId = o["ProcessorId"]?.ToString() ?? ""; break; }

        using (var s = new ManagementObjectSearcher(
            "SELECT SerialNumber FROM Win32_DiskDrive WHERE Index=0"))
            foreach (var o in s.Get()) { hddId = o["SerialNumber"]?.ToString()?.Trim() ?? ""; break; }

        using (var s = new ManagementObjectSearcher(
            "SELECT MACAddress FROM Win32_NetworkAdapterConfiguration WHERE IPEnabled=True"))
            foreach (var o in s.Get()) { macAddr = o["MACAddress"]?.ToString() ?? ""; break; }

        var combined = $"{cpuId}|{hddId}|{macAddr}";
        using var md5 = MD5.Create();
        var hash = md5.ComputeHash(Encoding.UTF8.GetBytes(combined));
        var hex = BitConverter.ToString(hash).Replace("-", "").Substring(0, 8);
        return $"DEV-{hex}";
    }
}`;

const codeSamples = [
  { id: "vb-helper", title: "VB.NET — API Helper Class", code: vbNetHelperCode, lang: "VB.NET" },
  { id: "vb-startup", title: "VB.NET — Startup License Check", code: vbNetStartupCode, lang: "VB.NET" },
  { id: "vb-register", title: "VB.NET — Registration Flow", code: vbNetRegisterCode, lang: "VB.NET" },
  { id: "vb-devices", title: "VB.NET — Device Management", code: vbNetDeviceCode, lang: "VB.NET" },
  { id: "csharp-helper", title: "C# — API Helper Class", code: csharpHelperCode, lang: "C#" },
];

/* ─── Status Flow Diagram Data ────────────────────────────── */

const statusFlows = [
  { from: "Install Software", to: "Register", arrow: "→" },
  { from: "Register", to: "PENDING", arrow: "→" },
  { from: "PENDING", to: "Admin Activates", arrow: "→ (Manual)" },
  { from: "PENDING", to: "Payment Success", arrow: "→ (Auto)" },
  { from: "Admin Activates", to: "ACTIVE", arrow: "→" },
  { from: "Payment Success", to: "ACTIVE", arrow: "→" },
  { from: "ACTIVE", to: "EXPIRED (time)", arrow: "→" },
  { from: "ACTIVE", to: "BLOCKED (admin)", arrow: "→" },
];

/* ─── Component ───────────────────────────────────────────── */

const ApiDocs = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeCategory, setActiveCategory] = useState("All");
  const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>(null);
  const [testingEndpoint, setTestingEndpoint] = useState<string | null>(null);
  const [testBodies, setTestBodies] = useState<Record<string, string>>({});
  const [testResponses, setTestResponses] = useState<Record<string, { status: number; body: string; time: number } | null>>({});
  const [loadingReq, setLoadingReq] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"endpoints" | "code" | "guide">("endpoints");
  const [expandedCode, setExpandedCode] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Shield size={24} className="text-accent" />
          </div>
          <p className="text-sm text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  const filtered = activeCategory === "All" ? endpoints : endpoints.filter((e) => e.category === activeCategory);

  const getDefaultBody = (ep: ApiEndpoint) => {
    if (ep.sampleRequest) return JSON.stringify(ep.sampleRequest, null, 2);
    if (!ep.requestBody) return "{}";
    const obj: Record<string, any> = {};
    Object.entries(ep.requestBody).forEach(([key, val]) => {
      try { obj[key] = JSON.parse(val.example); } catch { obj[key] = val.example; }
    });
    return JSON.stringify(obj, null, 2);
  };

  const handleTest = async (ep: ApiEndpoint) => {
    setLoadingReq((p) => ({ ...p, [ep.id]: true }));
    setTestResponses((p) => ({ ...p, [ep.id]: null }));
    const body = testBodies[ep.id] || getDefaultBody(ep);
    const start = performance.now();
    try {
      const res = await fetch(`${BASE_URL}${ep.path}`, {
        method: ep.method,
        headers: { "Content-Type": "application/json", apikey: ANON_KEY },
        body: ep.method === "POST" ? body : undefined,
      });
      const text = await res.text();
      const time = Math.round(performance.now() - start);
      let formatted: string;
      try { formatted = JSON.stringify(JSON.parse(text), null, 2); } catch { formatted = text; }
      setTestResponses((p) => ({ ...p, [ep.id]: { status: res.status, body: formatted, time } }));
    } catch (err: any) {
      setTestResponses((p) => ({ ...p, [ep.id]: { status: 0, body: JSON.stringify({ error: err.message }, null, 2), time: 0 } }));
    }
    setLoadingReq((p) => ({ ...p, [ep.id]: false }));
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    toast({ title: "Copied to clipboard" });
    setTimeout(() => setCopied(null), 2000);
  };

  const getStatusColor = (s: number) => s >= 200 && s < 300 ? "text-[hsl(142,70%,45%)]" : s >= 400 && s < 500 ? "text-[hsl(45,100%,51%)]" : "text-destructive";
  const getMethodColor = (m: string) => m === "GET" ? "bg-[hsl(142,70%,45%)]/15 text-[hsl(142,70%,45%)] border-[hsl(142,70%,45%)]/30" : "bg-accent/15 text-accent border-accent/30";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-30">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold text-foreground">
            <img src={alplumLogo} alt="Alplum Plus" className="h-10 w-10" />
            Alplum <span className="text-gradient-gold">Plus</span>
          </Link>
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={16} /> Back to Home
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent/30 bg-accent/5 text-accent text-xs font-semibold mb-4">
            <Code2 size={14} /> Developer API v2.0
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
            API <span className="text-gradient-gold">Documentation</span>
          </h1>
          <p className="text-muted-foreground text-base max-w-2xl mx-auto">
            Complete REST API reference for the AlplumPlus / FX MinuteAlbum licensing system.
            Includes VB.NET & C# code samples, live testing, and integration guides.
          </p>
        </motion.div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { icon: Server, label: "Protocol", value: "REST / HTTPS" },
            { icon: FileJson, label: "Format", value: "JSON" },
            { icon: Shield, label: "Auth", value: "API Key Header" },
            { icon: Zap, label: "Endpoints", value: `${endpoints.length} APIs` },
          ].map((item) => (
            <div key={item.label} className="bg-card rounded-xl border border-border p-4 text-center shadow-card">
              <item.icon size={18} className="text-accent mx-auto mb-2" />
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.label}</div>
              <div className="text-sm font-bold text-foreground">{item.value}</div>
            </div>
          ))}
        </div>

        {/* Base URL Box */}
        <div className="bg-card rounded-xl border border-border p-4 mb-6 shadow-card">
          <div className="text-xs text-muted-foreground mb-1 font-semibold uppercase tracking-wider">🔗 Base URL</div>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm font-mono text-accent bg-secondary/50 rounded-lg px-3 py-2 overflow-x-auto">
              {BASE_URL}
            </code>
            <Button variant="ghost" size="sm" onClick={() => copyText(BASE_URL, "base-url")} className="shrink-0">
              {copied === "base-url" ? <Check size={14} /> : <Copy size={14} />}
            </Button>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            <strong>Headers required:</strong> <code className="text-accent">apikey: YOUR_ANON_KEY</code> &nbsp;|&nbsp; <code className="text-accent">Content-Type: application/json</code>
          </div>
        </div>

        {/* Main Tabs */}
        <div className="flex gap-2 mb-6 border-b border-border pb-3">
          {([
            { id: "endpoints" as const, icon: Terminal, label: "API Endpoints" },
            { id: "code" as const, icon: Code2, label: "Code Samples" },
            { id: "guide" as const, icon: BookOpen, label: "Integration Guide" },
          ]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-gradient-gold text-accent-foreground shadow-gold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon size={14} /> {tab.label}
            </button>
          ))}
        </div>

        {/* ═══ TAB: ENDPOINTS ═══ */}
        {activeTab === "endpoints" && (
          <div>
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 mb-4">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    activeCategory === cat
                      ? "bg-accent text-accent-foreground"
                      : "bg-secondary border border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Endpoint Cards */}
            <div className="space-y-3">
              {filtered.map((ep, i) => (
                <motion.div
                  key={ep.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-card rounded-2xl border border-border shadow-card overflow-hidden"
                >
                  {/* Header */}
                  <button
                    onClick={() => setExpandedEndpoint(expandedEndpoint === ep.id ? null : ep.id)}
                    className="w-full flex items-center gap-3 p-4 text-left hover:bg-secondary/30 transition-colors"
                  >
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border shrink-0 ${getMethodColor(ep.method)}`}>
                      {ep.method}
                    </span>
                    <code className="text-sm font-mono text-foreground flex-1 truncate">{ep.path}</code>
                    <span className="text-xs text-muted-foreground hidden md:block shrink-0">{ep.name}</span>
                    {expandedEndpoint === ep.id ? <ChevronDown size={16} className="text-muted-foreground shrink-0" /> : <ChevronRight size={16} className="text-muted-foreground shrink-0" />}
                  </button>

                  {/* Expanded */}
                  <AnimatePresence>
                    {expandedEndpoint === ep.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
                          <p className="text-sm text-muted-foreground">{ep.description}</p>

                          {/* Notes */}
                          {ep.notes && (
                            <div className="bg-accent/5 border border-accent/20 rounded-xl p-3">
                              <div className="text-xs font-bold text-accent mb-1">💡 Developer Notes</div>
                              <ul className="text-xs text-muted-foreground space-y-1">
                                {ep.notes.map((note, ni) => (
                                  <li key={ni} className="flex gap-2">
                                    <span className="text-accent shrink-0">•</span>
                                    <span>{note}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Parameters */}
                          {ep.requestBody && (
                            <div>
                              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">📋 Request Body Parameters</h4>
                              <div className="rounded-xl border border-border overflow-x-auto">
                                <table className="w-full text-xs min-w-[500px]">
                                  <thead>
                                    <tr className="bg-secondary/50">
                                      <th className="text-left p-2.5 font-semibold text-muted-foreground">Parameter</th>
                                      <th className="text-left p-2.5 font-semibold text-muted-foreground">Type</th>
                                      <th className="text-left p-2.5 font-semibold text-muted-foreground">Required</th>
                                      <th className="text-left p-2.5 font-semibold text-muted-foreground">Description</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {Object.entries(ep.requestBody).map(([key, val]) => (
                                      <tr key={key} className="border-t border-border">
                                        <td className="p-2.5 font-mono text-accent">{key}</td>
                                        <td className="p-2.5 text-muted-foreground">{val.type}</td>
                                        <td className="p-2.5">
                                          {val.required
                                            ? <span className="text-[hsl(0,84%,60%)] font-bold">Yes</span>
                                            : <span className="text-muted-foreground">No</span>}
                                        </td>
                                        <td className="p-2.5 text-muted-foreground">{val.description}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}

                          {/* Status Codes */}
                          {ep.statusCodes && (
                            <div>
                              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">📊 Status Codes</h4>
                              <div className="flex flex-wrap gap-2">
                                {ep.statusCodes.map((sc) => (
                                  <div key={sc.code} className={`text-xs px-3 py-1.5 rounded-lg border ${
                                    sc.code < 300 ? "border-[hsl(142,70%,45%)]/30 bg-[hsl(142,70%,45%)]/5 text-[hsl(142,70%,45%)]"
                                    : sc.code < 500 ? "border-[hsl(45,100%,51%)]/30 bg-[hsl(45,100%,51%)]/5 text-[hsl(45,100%,51%)]"
                                    : "border-destructive/30 bg-destructive/5 text-destructive"
                                  }`}>
                                    <strong>{sc.code}</strong> — {sc.meaning}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Sample Response */}
                          <div className="grid md:grid-cols-2 gap-3">
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="text-xs font-bold text-[hsl(142,70%,45%)] uppercase tracking-wider">✅ Success Response</h4>
                                <Button variant="ghost" size="sm" className="h-5 text-[10px] px-2" onClick={() => copyText(JSON.stringify(ep.sampleResponse, null, 2), `resp-${ep.id}`)}>
                                  {copied === `resp-${ep.id}` ? <Check size={10} /> : <Copy size={10} />}
                                </Button>
                              </div>
                              <pre className="bg-secondary/50 rounded-xl p-3 text-[11px] font-mono text-foreground overflow-x-auto max-h-48 leading-relaxed">
                                {JSON.stringify(ep.sampleResponse, null, 2)}
                              </pre>
                            </div>
                            {ep.sampleErrorResponse && (
                              <div>
                                <h4 className="text-xs font-bold text-destructive uppercase tracking-wider mb-1">❌ Error Response</h4>
                                <pre className="bg-destructive/5 border border-destructive/20 rounded-xl p-3 text-[11px] font-mono text-destructive overflow-x-auto max-h-48 leading-relaxed">
                                  {JSON.stringify(ep.sampleErrorResponse, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>

                          {/* Live Test */}
                          <div className="border-t border-border pt-4">
                            <button
                              onClick={() => setTestingEndpoint(testingEndpoint === ep.id ? null : ep.id)}
                              className="flex items-center gap-2 text-sm font-bold text-accent hover:underline"
                            >
                              <Zap size={14} />
                              {testingEndpoint === ep.id ? "Hide Test Panel" : "🧪 Try it Live"}
                            </button>
                            <AnimatePresence>
                              {testingEndpoint === ep.id && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden mt-3 space-y-3"
                                >
                                  {ep.method === "POST" && (
                                    <div>
                                      <label className="text-xs font-semibold text-muted-foreground block mb-1">Request Body (editable JSON)</label>
                                      <textarea
                                        value={testBodies[ep.id] ?? getDefaultBody(ep)}
                                        onChange={(e) => setTestBodies((p) => ({ ...p, [ep.id]: e.target.value }))}
                                        className="w-full h-44 px-3 py-2 rounded-xl bg-secondary border border-border text-foreground font-mono text-xs resize-none focus:outline-none focus:ring-2 focus:ring-accent/40"
                                      />
                                    </div>
                                  )}
                                  <div className="flex items-center gap-3">
                                    <Button onClick={() => handleTest(ep)} disabled={loadingReq[ep.id]} className="bg-gradient-gold text-accent-foreground font-semibold gap-2 rounded-xl">
                                      <Send size={14} /> {loadingReq[ep.id] ? "Sending..." : "Send Request"}
                                    </Button>
                                    <span className="text-[10px] text-muted-foreground">
                                      {ep.method} {BASE_URL}{ep.path}
                                    </span>
                                  </div>
                                  {testResponses[ep.id] && (
                                    <div>
                                      <div className="flex items-center gap-3 mb-1">
                                        <span className={`text-sm font-bold ${getStatusColor(testResponses[ep.id]!.status)}`}>
                                          HTTP {testResponses[ep.id]!.status}
                                        </span>
                                        <span className="text-xs text-muted-foreground">{testResponses[ep.id]!.time}ms</span>
                                      </div>
                                      <pre className="bg-secondary/50 rounded-xl p-3 text-[11px] font-mono text-foreground overflow-x-auto max-h-64 leading-relaxed">
                                        {testResponses[ep.id]!.body}
                                      </pre>
                                    </div>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ TAB: CODE SAMPLES ═══ */}
        {activeTab === "code" && (
          <div className="space-y-4">
            <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 mb-4">
              <h3 className="font-bold text-foreground text-sm mb-2 flex items-center gap-2">
                <AlertTriangle size={16} className="text-accent" /> Prerequisites
              </h3>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Install <strong>Newtonsoft.Json</strong> NuGet package</li>
                <li>• Add reference to <strong>System.Management</strong></li>
                <li>• Add reference to <strong>System.Net.Http</strong></li>
                <li>• Replace <code className="text-accent">YOUR_ANON_KEY</code> with your actual API key</li>
                <li>• Ensure your app targets <strong>.NET Framework 4.7.2+</strong> or <strong>.NET 6+</strong></li>
              </ul>
            </div>

            {codeSamples.map((sample) => (
              <div key={sample.id} className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
                <button
                  onClick={() => setExpandedCode(expandedCode === sample.id ? null : sample.id)}
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-secondary/30 transition-colors"
                >
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                    sample.lang === "C#" ? "border-[hsl(265,70%,60%)]/30 bg-[hsl(265,70%,60%)]/15 text-[hsl(265,70%,60%)]"
                    : "border-[hsl(210,70%,60%)]/30 bg-[hsl(210,70%,60%)]/15 text-[hsl(210,70%,60%)]"
                  }`}>
                    {sample.lang}
                  </span>
                  <span className="text-sm font-semibold text-foreground flex-1">{sample.title}</span>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={(e) => { e.stopPropagation(); copyText(sample.code, sample.id); }}>
                      {copied === sample.id ? <Check size={12} /> : <Copy size={12} />} Copy
                    </Button>
                    {expandedCode === sample.id ? <ChevronDown size={16} className="text-muted-foreground" /> : <ChevronRight size={16} className="text-muted-foreground" />}
                  </div>
                </button>
                <AnimatePresence>
                  {expandedCode === sample.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <pre className="px-4 pb-4 text-[11px] font-mono text-foreground overflow-x-auto leading-relaxed whitespace-pre-wrap max-h-[600px] overflow-y-auto">
                        {sample.code}
                      </pre>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}

        {/* ═══ TAB: INTEGRATION GUIDE ═══ */}
        {activeTab === "guide" && (
          <div className="space-y-6">
            {/* Status Flow */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
              <h2 className="font-display text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Activity size={20} className="text-accent" /> License Status Flow
              </h2>
              <div className="bg-secondary/50 rounded-xl p-4 overflow-x-auto">
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono min-w-[600px]">
                  {statusFlows.map((flow, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-lg border ${
                        flow.to === "ACTIVE" ? "bg-[hsl(142,70%,45%)]/10 border-[hsl(142,70%,45%)]/30 text-[hsl(142,70%,45%)]"
                        : flow.to.includes("EXPIRED") ? "bg-destructive/10 border-destructive/30 text-destructive"
                        : flow.to.includes("BLOCKED") ? "bg-destructive/10 border-destructive/30 text-destructive"
                        : flow.to === "PENDING" ? "bg-[hsl(45,100%,51%)]/10 border-[hsl(45,100%,51%)]/30 text-[hsl(45,100%,51%)]"
                        : "bg-secondary border-border text-foreground"
                      }`}>
                        {flow.from}
                      </span>
                      <span className="text-muted-foreground">{flow.arrow}</span>
                      {i === statusFlows.length - 1 && (
                        <span className="px-2 py-1 rounded-lg border bg-destructive/10 border-destructive/30 text-destructive">
                          {flow.to}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Startup Flow */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
              <h2 className="font-display text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Monitor size={20} className="text-accent" /> Software Startup Flow
              </h2>
              <div className="space-y-3">
                {[
                  { step: "1", title: "Generate Device ID", desc: "Hash CPU + HDD + MAC address using MD5. Result: DEV-XXXXXXXX", icon: HardDrive },
                  { step: "2", title: "Call /check-license", desc: "Send email + device_id + software_version. This is the MAIN sync endpoint.", icon: RefreshCw },
                  { step: "3", title: "Handle Response Status", desc: "active → allow | expired → block + show renewal | blocked → block + show message | device_limit_reached → show device list | pending → show waiting screen", icon: Activity },
                  { step: "4", title: "Periodic Re-check", desc: "Call /check-license every 5-10 minutes in background. Update UI on status change.", icon: Clock },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-3 p-3 rounded-xl bg-secondary/50">
                    <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                      <span className="text-accent font-bold text-sm">{item.step}</span>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-foreground flex items-center gap-2">
                        <item.icon size={14} className="text-accent" /> {item.title}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Device ID Generation */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
              <h2 className="font-display text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Key size={20} className="text-accent" /> Device ID Generation Logic
              </h2>
              <div className="bg-secondary/50 rounded-xl p-4">
                <pre className="text-[11px] font-mono text-foreground leading-relaxed whitespace-pre-wrap">{`Algorithm:
1. Get CPU ID     → Win32_Processor.ProcessorId
2. Get HDD Serial → Win32_DiskDrive[0].SerialNumber
3. Get MAC Address → Win32_NetworkAdapterConfiguration.MACAddress

4. Combine: "{CPU}|{HDD}|{MAC}"
5. Hash with MD5
6. Take first 8 hex chars
7. Prefix: "DEV-" + hash

Result: "DEV-A1B2C3D4"

⚠ IMPORTANT:
• Device ID must remain STABLE across reboots
• Do NOT include RAM size or disk space (these change)
• DO include CPU, HDD serial, MAC (hardware-bound)
• If user changes motherboard → new device ID → new activation needed`}</pre>
              </div>
            </div>

            {/* Multi-Device Logic */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
              <h2 className="font-display text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Users size={20} className="text-accent" /> Multi-Device License Logic
              </h2>
              <div className="space-y-3">
                <div className="bg-secondary/50 rounded-xl p-4 text-xs text-muted-foreground space-y-2">
                  <p><strong className="text-foreground">How it works:</strong></p>
                  <p>Each license has a <code className="text-accent">max_devices</code> field (default: 1).</p>
                  <p>When a user calls <code className="text-accent">/check-license</code>, the system checks:</p>
                  <ol className="list-decimal ml-4 space-y-1">
                    <li>Is this device already in the active list? → Allow</li>
                    <li>Is active_count &lt; max_devices? → Add device & allow</li>
                    <li>Is active_count ≥ max_devices? → Return <code className="text-accent">device_limit_reached</code></li>
                  </ol>
                  <p className="mt-2"><strong className="text-foreground">Example:</strong> Plan allows 2 PCs</p>
                  <div className="bg-background/50 rounded-lg p-2 font-mono">
                    PC-1: DEV-AAAA → ✅ Active (count: 1/2)<br/>
                    PC-2: DEV-BBBB → ✅ Active (count: 2/2)<br/>
                    PC-3: DEV-CCCC → ❌ Limit reached → show deactivation dialog
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Integration */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
              <h2 className="font-display text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <CreditCard size={20} className="text-accent" /> Payment Auto-Activation Flow
              </h2>
              <div className="space-y-3">
                {[
                  { step: "1", desc: "User pays via Razorpay / PhonePe / UPI on website" },
                  { step: "2", desc: "Payment gateway sends webhook / callback to your server" },
                  { step: "3", desc: "Server calls POST /payment-verify with payment_id, email/phone, plan_name, duration_days" },
                  { step: "4", desc: "API matches user by email or phone number" },
                  { step: "5", desc: "License is auto-created + device activated if device_id provided" },
                  { step: "6", desc: "Next time software calls /check-license → status = active" },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                      <span className="text-accent font-bold text-[10px]">{item.step}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{item.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Security Best Practices */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
              <h2 className="font-display text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Shield size={20} className="text-accent" /> Security Best Practices
              </h2>
              <div className="grid md:grid-cols-2 gap-3">
                {[
                  { title: "Use HTTPS Only", desc: "All API calls must be over HTTPS. Never use HTTP." },
                  { title: "Validate Server Time", desc: "Use server-returned expiry dates. Never trust local clock." },
                  { title: "Store API Key Securely", desc: "Don't hardcode API key in plain text. Use encrypted config or registry." },
                  { title: "No Caching of Status", desc: "Always call /check-license on startup. Don't rely on cached results." },
                  { title: "Handle Network Errors", desc: "If API is unreachable, show warning but allow limited offline use." },
                  { title: "Prevent Device ID Spoofing", desc: "Use hardware-bound IDs (CPU+HDD+MAC). Don't use software-only identifiers." },
                ].map((item) => (
                  <div key={item.title} className="p-3 rounded-xl bg-secondary/50 border border-border">
                    <div className="text-xs font-bold text-foreground mb-1">🔒 {item.title}</div>
                    <div className="text-[11px] text-muted-foreground">{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Reference */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
              <h2 className="font-display text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Smartphone size={20} className="text-accent" /> Response Status Values Reference
              </h2>
              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-secondary/50">
                      <th className="text-left p-3 font-semibold text-muted-foreground">Status</th>
                      <th className="text-left p-3 font-semibold text-muted-foreground">Meaning</th>
                      <th className="text-left p-3 font-semibold text-muted-foreground">Software Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { status: "active", meaning: "License valid & active", action: "✅ Allow full access", color: "text-[hsl(142,70%,45%)]" },
                      { status: "expired", meaning: "License past expiry date", action: "🚫 Block + show renewal", color: "text-destructive" },
                      { status: "blocked", meaning: "Admin manually blocked", action: "🚫 Block + contact support", color: "text-destructive" },
                      { status: "pending", meaning: "Waiting for activation", action: "⏳ Show waiting screen", color: "text-[hsl(45,100%,51%)]" },
                      { status: "device_limit_reached", meaning: "Max devices exceeded", action: "⚠️ Show device management", color: "text-[hsl(45,100%,51%)]" },
                      { status: "no_license", meaning: "No license record found", action: "📝 Show registration form", color: "text-muted-foreground" },
                      { status: "not_found", meaning: "User doesn't exist", action: "📝 Show registration form", color: "text-muted-foreground" },
                      { status: "rejected", meaning: "Admin rejected request", action: "❌ Show rejection message", color: "text-destructive" },
                    ].map((row) => (
                      <tr key={row.status} className="border-t border-border">
                        <td className={`p-3 font-mono font-bold ${row.color}`}>{row.status}</td>
                        <td className="p-3 text-muted-foreground">{row.meaning}</td>
                        <td className="p-3 text-foreground">{row.action}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ApiDocs;
