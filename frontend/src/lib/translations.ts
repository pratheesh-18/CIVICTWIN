export type Language = "en" | "ta";

export const translations = {
  en: {
    // Brand & Topbar
    brand: "CivicTwin",
    tagline: "Autonomous Civic Redressal & Ground-Truth Verification",
    operationalBadge: "5 AGENTS OPERATIONAL",
    logout: "Log out",
    switchLanguage: "தமிழ்",

    // Auth Page
    loginHeading: "Welcome to CivicTwin",
    loginSubheading: "Report a problem on your street and track it until it is fixed.",
    citizenTab: "Citizen",
    departmentTab: "Department",
    mobileLabel: "Mobile Number",
    mobilePlaceholder: "10-digit mobile number",
    mobileHelp: "We will send a 6-digit verification code to your phone.",
    sendOtp: "Send OTP",
    sendingOtp: "Sending code...",
    otpLabel: "Enter 6-Digit OTP",
    otpHelp: "Sent to",
    resendOtp: "Resend Code",
    resendCooldown: "Resend in",
    seconds: "s",
    verifyAndLogin: "Verify & Continue",
    verifying: "Verifying...",
    signInCitizen: "Sign In as Citizen",
    newHere: "New here?",
    registerLink: "Register as a Citizen",
    registeredAlready: "Already registered?",
    loginLink: "Log in here",

    // Department Login
    usernameLabel: "Department Username",
    usernamePlaceholder: "e.g. roads_officer, commissioner",
    passwordLabel: "Password",
    passwordPlaceholder: "Enter password",
    departmentLoginBtn: "Sign in to Command Center",

    // Register Page
    registerHeading: "Citizen Registration",
    registerSubheading: "Create your verified civic account in 30 seconds.",
    fullNameLabel: "Full Name",
    fullNamePlaceholder: "Enter your name (e.g. Anand)",
    registerAndSendOtp: "Send Verification Code",

    // Citizen Dashboard
    greeting: "Hello",
    openComplaintsSummary: "You have {count} open complaint(s)",
    noOpenComplaints: "You have no open complaints at this time.",
    myComplaintsTitle: "My Complaints",
    filterAll: "All",
    filterOpen: "Open",
    filterResolved: "Resolved",
    emptyComplaints: "No complaints yet. Choose a department below to report one.",
    mergedNotice: "Merged with {count} other nearby reports by Agent 2",
    viewDetails: "View Details",
    ticketId: "Ticket #",
    slaRemaining: "SLA: {hours}h target",
    location: "Location",
    category: "Category",
    submittedOn: "Submitted on",

    // Report a Problem / Department Tiles
    reportSectionTitle: "Report a Problem",
    reportSectionSubtitle: "Select a municipal service department to initiate instant automated agent intake",
    tileRoads: "Roads",
    tileRoadsDesc: "Potholes, broken roads, damaged pavements",
    tileWater: "Water & Drainage",
    tileWaterDesc: "Pipe leaks, contaminated water, overflowing drains",
    tileElectrical: "Electrical",
    tileElectricalDesc: "Streetlights not working, dangling wires, fallen poles",
    tileSanitation: "Sanitation",
    tileSanitationDesc: "Garbage overflow, uncleared bins, dead animals",
    tileOther: "Other Services",
    tileOtherDesc: "Park maintenance, stray animals, public nuisances",

    // Officer Dashboard
    officerDashboardTitle: "Municipal Command Center",
    officerSubtitle: "Spatial hazard cluster queue & Agent 5 ground-truth resolution audit",
    departmentBadge: "Department Jurisdiction",
    allDepartments: "All Municipal Departments (City Commissioner)",

    // Errors
    errorInvalidPhone: "Please enter a valid 10-digit mobile number.",
    errorInvalidName: "Please enter your full name.",
    errorInvalidOtp: "Please enter a complete 6-digit verification code.",
    errorUnregistered: "Mobile number is not registered. Please create an account first.",
  },
  ta: {
    // Brand & Topbar
    brand: "சிவிக் ட்வின் (CivicTwin)",
    tagline: "தானியங்கி நகராட்சி குறைதீர்ப்பு மற்றும் சரிபார்ப்பு தளம்",
    operationalBadge: "5 ஏஜென்ட்கள் இயங்குகின்றன",
    logout: "வெளியேறு",
    switchLanguage: "English",

    // Auth Page
    loginHeading: "சிவிக் ட்வின்-க்கு நல்வரவு",
    loginSubheading: "உங்கள் தெருவில் உள்ள பிரச்சனையை பதிவிட்டு, அது சரிசெய்யப்படும் வரை கண்காணிக்கவும்.",
    citizenTab: "பொதுமக்கள்",
    departmentTab: "துறை அலுவலர்",
    mobileLabel: "கைபேசி எண்",
    mobilePlaceholder: "10-இலக்க கைபேசி எண்",
    mobileHelp: "உங்கள் கைபேசிக்கு 6-இலக்க சரிபார்ப்புக் குறியீடு அனுப்பப்படும்.",
    sendOtp: "OTP பெறுக",
    sendingOtp: "அனுப்பப்படுகிறது...",
    otpLabel: "6-இலக்க OTP உள்ளிடவும்",
    otpHelp: "அனுப்பப்பட்ட எண்:",
    resendOtp: "மறுபடியும் OTP அனுப்புக",
    resendCooldown: "மறுமுறை அனுப்ப இன்னும்",
    seconds: "நொடிகள்",
    verifyAndLogin: "சரிபார்த்து தொடரவும்",
    verifying: "சரிபார்க்கப்படுகிறது...",
    signInCitizen: "உள்நுழைக",
    newHere: "புதிய பயனரா?",
    registerLink: "புதிய கணக்கு தொடங்குக",
    registeredAlready: "ஏற்கனவே கணக்கு உள்ளதா?",
    loginLink: "உள்நுழைய இங்கே சொடுக்கவும்",

    // Department Login
    usernameLabel: "அலுவலர் பயனர் பெயர்",
    usernamePlaceholder: "எ.கா. roads_officer, commissioner",
    passwordLabel: "கடவுச்சொல்",
    passwordPlaceholder: "கடவுச்சொல்லை உள்ளிடவும்",
    departmentLoginBtn: "கட்டுப்பாட்டு அறையில் நுழைக",

    // Register Page
    registerHeading: "பொதுமக்கள் பதிவு",
    registerSubheading: "30 நொடிகளில் உங்கள் சரிபார்க்கப்பட்ட கணக்கை உருவாக்குங்கள்.",
    fullNameLabel: "முழு பெயர்",
    fullNamePlaceholder: "உங்கள் பெயர் (எ.கா. ஆனந்த்)",
    registerAndSendOtp: "சரிபார்ப்புக் குறியீடு அனுப்புக",

    // Citizen Dashboard
    greeting: "வணக்கம்",
    openComplaintsSummary: "உங்களிடம் {count} நிலுவையில் உள்ள புகார்கள் உள்ளன",
    noOpenComplaints: "தற்போது நிலுவையில் புகார்கள் ஏதுமில்லை.",
    myComplaintsTitle: "எனது புகார்கள்",
    filterAll: "அனைத்தும்",
    filterOpen: "நிலுவையில்",
    filterResolved: "சரிசெய்யப்பட்டவை",
    emptyComplaints: "புகார்கள் எதுவும் இல்லை. புகார் அளிக்க கீழே உள்ள துறையைத் தேர்ந்தெடுக்கவும்.",
    mergedNotice: "ஏஜென்ட் 2 மூலம் அருகிலுள்ள {count} புகார்களுடன் ஒருங்கிணைக்கப்பட்டது",
    viewDetails: "விவரங்களைப் பார்க்க",
    ticketId: "புகார் எண் #",
    slaRemaining: "இலக்கு: {hours} மணி நேரம்",
    location: "இடம்",
    category: "துறை",
    submittedOn: "பதிவு செய்யப்பட்ட நாள்",

    // Report a Problem / Department Tiles
    reportSectionTitle: "புதிய புகார் பதிவு செய்க",
    reportSectionSubtitle: "தானியங்கி ஏஜென்ட் ஆய்வைத் தொடங்க நகராட்சித் துறையைத் தேர்ந்தெடுக்கவும்",
    tileRoads: "சாலைகள் துறை",
    tileRoadsDesc: "குழிகள், உடைந்த தார் சாலைகள், சேதமடைந்த நடைபாதைகள்",
    tileWater: "குடிநீர் & கழிவுநீர்",
    tileWaterDesc: "குடிநீர் குழாய் உடைப்பு, அசுத்த நீர், கழிவுநீர் பெருக்கெடுத்தல்",
    tileElectrical: "மின்சார துறை",
    tileElectricalDesc: "தெருவிளக்கு எரியவில்லை, தொங்கும் கம்பிகள், உடைந்த மின்கம்பங்கள்",
    tileSanitation: "தூய்மைப் பணி",
    tileSanitationDesc: "குப்பைத் தொட்டி நிரம்பி வழிதல், அள்ளப்படாத கழிவுகள்",
    tileOther: "இதர சேவைகள்",
    tileOtherDesc: "பூங்கா பராமரிப்பு, தெரு விலங்குகள், பொது தொல்லைகள்",

    // Officer Dashboard
    officerDashboardTitle: "நகராட்சி கட்டளை மையம்",
    officerSubtitle: "அபாயக் குழுமம் மற்றும் ஏஜென்ட் 5 உண்மை சரிபார்ப்பு தணிக்கை",
    departmentBadge: "துறைப் பொறுப்பு",
    allDepartments: "அனைத்து நகராட்சி துறைகள் (ஆணையர் மேற்பார்வை)",

    // Errors
    errorInvalidPhone: "சரியான 10-இலக்க கைபேசி எண்ணை உள்ளிடவும்.",
    errorInvalidName: "உங்கள் முழு பெயரை உள்ளிடவும்.",
    errorInvalidOtp: "முழுமையான 6-இலக்க OTP குறியீட்டை உள்ளிடவும்.",
    errorUnregistered: "இந்த எண் பதிவு செய்யப்படவில்லை. முதலில் பதிவு செய்து கொள்ளவும்.",
  },
};
