import React, { useState, useEffect } from 'react';
import {
  User,
  UserProfile,
  MeasurementRecord,
  SheetReferenceRanges,
  TabType,
  ViewType,
} from './types';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { HomeView } from './components/HomeView';
import { RecordView } from './components/RecordView';
import { MeasurementDetailView } from './components/MeasurementDetailView';
import { LoginView } from './components/LoginView';
import { SignUpView } from './components/SignUpView';
import { NicknameSetupView } from './components/NicknameSetupView';
import { ScanModal } from './components/ScanModal';
import { CameraView } from './components/CameraView';
import { MyView } from './components/MyView';
import { NotificationModal } from './components/NotificationModal';

interface RegisteredAccount extends User {
  password?: string;
}

export default function App() {
  // 1. Registered Users Directory (stored locally)
  const [users, setUsers] = useState<RegisteredAccount[]>(() => {
    try {
      const saved = localStorage.getItem('bodylog_users');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 2. Profiles Directory (stored locally)
  const [profiles, setProfiles] = useState<UserProfile[]>(() => {
    try {
      const saved = localStorage.getItem('bodylog_profiles');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 3. Current User state
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const savedId = localStorage.getItem('bodylog_current_user_id');
      if (!savedId) return null;
      const savedUsers: RegisteredAccount[] = JSON.parse(
        localStorage.getItem('bodylog_users') || '[]'
      );
      const found = savedUsers.find((u) => u.id === savedId);
      return found ? { id: found.id, email: found.email } : null;
    } catch {
      return null;
    }
  });

  // 4. Current User Profile
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    try {
      const savedId = localStorage.getItem('bodylog_current_user_id');
      if (!savedId) return null;
      const savedProfiles: UserProfile[] = JSON.parse(
        localStorage.getItem('bodylog_profiles') || '[]'
      );
      return savedProfiles.find((p) => p.userId === savedId) || null;
    } catch {
      return null;
    }
  });

  // 5. Records store (contains userId)
  const [records, setRecords] = useState<MeasurementRecord[]>(() => {
    try {
      const saved = localStorage.getItem('bodylog_records');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Auth screen state ('login' | 'signup')
  const [authScreen, setAuthScreen] = useState<'login' | 'signup'>('login');
  // Editing nickname from My page
  const [isEditingNickname, setIsEditingNickname] = useState(false);

  // Navigation state for authenticated main view
  const [currentTab, setCurrentTab] = useState<TabType>('home');
  const [activeView, setActiveView] = useState<ViewType>('main');
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  // Modals state
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [scannerSource, setScannerSource] = useState<'camera' | 'gallery' | 'file'>('camera');
  const [selectedFileForScan, setSelectedFileForScan] = useState<File | null>(null);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  // Save users directory to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('bodylog_users', JSON.stringify(users));
    } catch (e) {
      console.error(e);
    }
  }, [users]);

  // Save profiles directory to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('bodylog_profiles', JSON.stringify(profiles));
    } catch (e) {
      console.error(e);
    }
  }, [profiles]);

  // Save current user ID to localStorage
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem('bodylog_current_user_id', currentUser.id);
      } else {
        localStorage.removeItem('bodylog_current_user_id');
      }
    } catch (e) {
      console.error(e);
    }
  }, [currentUser]);

  // Save records to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('bodylog_records', JSON.stringify(records));
    } catch (e) {
      console.error(e);
    }
  }, [records]);

  // Keep userProfile synchronized with profiles store
  const saveUserProfile = (newProfile: UserProfile) => {
    setUserProfile(newProfile);
    setProfiles((prev) => {
      const filtered = prev.filter((p) => p.userId !== newProfile.userId);
      return [...filtered, newProfile];
    });
  };

  // Auth Handlers
  const handleLoginAuth = (
    email: string,
    pass: string
  ): { success: boolean; error?: string } => {
    const trimmedEmail = email.trim().toLowerCase();
    const existing = users.find((u) => u.email.toLowerCase() === trimmedEmail);

    if (!existing) {
      return {
        success: false,
        error: '가입되지 않은 이메일 주소입니다. 회원가입을 먼저 진행해주세요.',
      };
    }

    if (existing.password && existing.password !== pass) {
      return {
        success: false,
        error: '비밀번호가 일치하지 않습니다. 다시 확인해주세요.',
      };
    }

    const authedUser: User = { id: existing.id, email: existing.email };
    setCurrentUser(authedUser);

    const existingProfile = profiles.find((p) => p.userId === existing.id);
    if (existingProfile) {
      setUserProfile(existingProfile);
    } else {
      const initialP: UserProfile = {
        userId: existing.id,
        nickname: '',
        privacyMode: false,
      };
      saveUserProfile(initialP);
    }

    return { success: true };
  };

  const handleSignUpAuth = (
    email: string,
    pass: string
  ): { success: boolean; error?: string } => {
    const trimmedEmail = email.trim().toLowerCase();
    const existing = users.find((u) => u.email.toLowerCase() === trimmedEmail);

    if (existing) {
      return {
        success: false,
        error: '이미 등록된 이메일 계정입니다. 로그인을 진행해주세요.',
      };
    }

    const newAccount: RegisteredAccount = {
      id: `user_${Date.now()}`,
      email: email.trim(),
      password: pass,
    };

    setUsers((prev) => [...prev, newAccount]);
    setCurrentUser({ id: newAccount.id, email: newAccount.email });

    const initialP: UserProfile = {
      userId: newAccount.id,
      nickname: '',
      privacyMode: false,
    };
    saveUserProfile(initialP);

    return { success: true };
  };

  const handleSocialLoginAuth = (provider: string) => {
    // Generate social account for demo/prototype convenience
    const demoEmail = `${provider}_user@bodylog.app`;
    const existing = users.find((u) => u.email === demoEmail);

    if (existing) {
      setCurrentUser({ id: existing.id, email: existing.email });
      const existingProfile = profiles.find((p) => p.userId === existing.id);
      if (existingProfile) {
        setUserProfile(existingProfile);
      } else {
        const initialP: UserProfile = {
          userId: existing.id,
          nickname: '',
          privacyMode: false,
        };
        saveUserProfile(initialP);
      }
    } else {
      const newAccount: RegisteredAccount = {
        id: `user_${provider}_${Date.now()}`,
        email: demoEmail,
      };
      setUsers((prev) => [...prev, newAccount]);
      setCurrentUser({ id: newAccount.id, email: newAccount.email });
      const initialP: UserProfile = {
        userId: newAccount.id,
        nickname: '',
        privacyMode: false,
      };
      saveUserProfile(initialP);
    }
  };

  const handleNicknameComplete = (nickname: string) => {
    if (!currentUser) return;
    const updated: UserProfile = {
      userId: currentUser.id,
      nickname,
      privacyMode: userProfile?.privacyMode ?? false,
    };
    saveUserProfile(updated);
    setIsEditingNickname(false);
    setActiveView('main');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setUserProfile(null);
    setIsEditingNickname(false);
    setActiveView('main');
    setCurrentTab('home');
    setAuthScreen('login');
  };

  // Filter records by current user
  const userRecords = currentUser
    ? records.filter((r) => r.userId === currentUser.id)
    : [];

  const sortedRecords = [...userRecords].sort((a, b) =>
    b.rawDate.localeCompare(a.rawDate)
  );
  const latestRecord = sortedRecords[0];

  // Current record for detail view
  const currentDetailRecord =
    userRecords.find((r) => r.id === selectedRecordId) || latestRecord;

  const detailIndex = sortedRecords.findIndex(
    (r) => r.id === currentDetailRecord?.id
  );
  const previousDetailRecord =
    detailIndex >= 0 && detailIndex < sortedRecords.length - 1
      ? sortedRecords[detailIndex + 1]
      : undefined;

  // Scan & Record Actions
  const handleOpenScanModal = () => {
    setIsScanModalOpen(true);
  };

  const handleSelectScanOption = (option: 'camera' | 'gallery' | 'file') => {
    setIsScanModalOpen(false);
    setSelectedFileForScan(null);
    setScannerSource(option);
    setIsCameraActive(true);
  };

  const handleFileUpload = (file: File) => {
    setIsScanModalOpen(false);
    setSelectedFileForScan(file);
    setScannerSource('file');
    setIsCameraActive(true);
  };

  const handleDirectInputFromModal = () => {
    setIsScanModalOpen(false);
    setSelectedFileForScan(null);
    setScannerSource('file');
    setIsCameraActive(true);
  };

  const handleSaveScannedRecord = (data: {
    date?: string;
    weight: number;
    skeletalMuscle: number;
    bodyFatPercent: number;
    bodyFatMass: number;
    bmi: number;
    visceralFat: number;
    sourceType: 'camera' | 'gallery' | 'file';
    referenceRanges?: SheetReferenceRanges;
  }) => {
    if (!currentUser) return;

    // Calculate deltas against current latest record of this user
    const prevWeight = latestRecord ? latestRecord.weight : data.weight;
    const prevMuscle = latestRecord ? latestRecord.skeletalMuscle : data.skeletalMuscle;
    const prevFat = latestRecord ? latestRecord.bodyFatPercent : data.bodyFatPercent;

    const weightDelta = Number((data.weight - prevWeight).toFixed(1));
    const muscleDelta = Number((data.skeletalMuscle - prevMuscle).toFixed(1));
    const fatDelta = Number((data.bodyFatPercent - prevFat).toFixed(1));

    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    let dateFormatted = `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())}`;
    let rawDateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
    let dateLabelStr = `${pad(now.getMonth() + 1)}.${pad(now.getDate())}`;

    if (data.date) {
      const parts = data.date.split('-');
      if (parts.length === 3) {
        dateFormatted = `${parts[0]}.${parts[1]}.${parts[2]}`;
        rawDateStr = `${data.date}T12:00`;
        dateLabelStr = `${parts[1]}.${parts[2]}`;
      }
    }

    const newId = `rec-${Date.now()}`;
    const newRecord: MeasurementRecord = {
      ...data,
      id: newId,
      userId: currentUser.id,
      date: dateFormatted,
      rawDate: rawDateStr,
      dateLabel: dateLabelStr,
      weightDelta,
      muscleDelta,
      fatDelta,
      isLatest: true,
      isBaseline: userRecords.length === 0,
      createdAt: now.toISOString(),
      referenceRanges: data.referenceRanges,
    };

    // Update records list
    const updated = [
      newRecord,
      ...records.map((r) =>
        r.userId === currentUser.id ? { ...r, isLatest: false } : r
      ),
    ];
    setRecords(updated);
    setSelectedFileForScan(null);

    // Close scanner view
    setIsCameraActive(false);

    // Navigate to detail view
    setSelectedRecordId(newId);
    setShowSaveSuccess(true);
    setActiveView('detail');
  };

  const handleSelectRecordForDetail = (recordId: string) => {
    setSelectedRecordId(recordId);
    setShowSaveSuccess(false);
    setActiveView('detail');
  };

  const handleClearUserRecords = () => {
    if (!currentUser) return;
    if (window.confirm('정말 내 모든 측정 기록을 삭제하시겠습니까?')) {
      setRecords((prev) => prev.filter((r) => r.userId !== currentUser.id));
      alert('모든 측정 기록이 삭제되었습니다.');
    }
  };

  const handleExportData = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(userRecords, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `body_log_${userProfile?.nickname || 'records'}_${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // ----------------------------------------------------
  // Authentication & Nickname Gate Routing
  // ----------------------------------------------------

  // 1. If not logged in -> Show Login or Sign Up
  if (!currentUser) {
    if (authScreen === 'signup') {
      return (
        <SignUpView
          onSignUp={handleSignUpAuth}
          onNavigateToLogin={() => setAuthScreen('login')}
        />
      );
    }
    return (
      <LoginView
        onLogin={handleLoginAuth}
        onSocialLogin={handleSocialLoginAuth}
        onNavigateToSignUp={() => setAuthScreen('signup')}
      />
    );
  }

  // 2. If logged in but nickname is missing -> Show Nickname Setup View
  if (!userProfile?.nickname || userProfile.nickname.trim() === '') {
    return (
      <NicknameSetupView
        initialNickname=""
        onComplete={handleNicknameComplete}
        mode="setup"
      />
    );
  }

  // 3. If editing nickname from MyView -> Show Nickname Setup View in 'edit' mode
  if (isEditingNickname) {
    return (
      <NicknameSetupView
        initialNickname={userProfile.nickname}
        onComplete={handleNicknameComplete}
        onCancel={() => setIsEditingNickname(false)}
        mode="edit"
      />
    );
  }

  // 4. Authenticated & Nickname Configured -> Full Application with Protected Views
  return (
    <div className="min-h-screen bg-[#fcf9f8] text-[#1c1b1b] flex flex-col font-sans relative">
      {/* Top Header */}
      <Header
        view={activeView}
        tab={currentTab}
        onBack={() => {
          if (activeView === 'detail') {
            setActiveView('main');
          }
        }}
        onOpenNotifications={() => setIsNotificationOpen(true)}
        onOpenProfile={() => {
          setCurrentTab('my');
          setActiveView('main');
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col pt-14 pb-safe relative">
        {activeView === 'detail' && currentDetailRecord && (
          <MeasurementDetailView
            record={currentDetailRecord}
            previousRecord={previousDetailRecord}
            allRecords={userRecords}
            showSaveSuccess={showSaveSuccess}
            onNavigateToRecords={() => {
              setActiveView('main');
              setCurrentTab('record');
            }}
            onNavigateToHome={() => {
              setActiveView('main');
              setCurrentTab('home');
            }}
          />
        )}

        {activeView === 'main' && currentTab === 'home' && (
          <HomeView
            userProfile={userProfile}
            latestRecord={latestRecord}
            previousRecord={sortedRecords[1]}
            totalRecordCount={userRecords.length}
            onOpenScanModal={handleOpenScanModal}
            onNavigateToRecords={() => setCurrentTab('record')}
            onViewRecordDetail={handleSelectRecordForDetail}
          />
        )}

        {activeView === 'main' && currentTab === 'record' && (
          <RecordView
            records={userRecords}
            onOpenScanModal={handleOpenScanModal}
            onSelectRecord={handleSelectRecordForDetail}
          />
        )}

        {activeView === 'main' && currentTab === 'my' && (
          <MyView
            currentUser={currentUser}
            userProfile={userProfile}
            records={userRecords}
            onEditProfile={() => setIsEditingNickname(true)}
            onTogglePrivacy={() => {
              if (userProfile) {
                saveUserProfile({
                  ...userProfile,
                  privacyMode: !userProfile.privacyMode,
                });
              }
            }}
            onClearRecords={handleClearUserRecords}
            onExportData={handleExportData}
            onLogout={handleLogout}
          />
        )}
      </main>

      {/* Bottom Navigation (Only visible in Main Tab View) */}
      {activeView === 'main' && (
        <BottomNav
          currentTab={currentTab}
          onSelectTab={(tab) => {
            setCurrentTab(tab);
          }}
        />
      )}

      {/* Scan Source Picker Modal */}
      <ScanModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        onSelectOption={handleSelectScanOption}
        onFileUpload={handleFileUpload}
        onDirectInput={handleDirectInputFromModal}
      />

      {/* Live Camera / Scanner View */}
      {isCameraActive && (
        <CameraView
          sourceType={scannerSource}
          initialFile={selectedFileForScan}
          onClose={() => {
            setIsCameraActive(false);
            setSelectedFileForScan(null);
          }}
          onSaveRecord={handleSaveScannedRecord}
          previousRecord={latestRecord}
        />
      )}

      {/* Notification Center Modal */}
      <NotificationModal
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
      />
    </div>
  );
}
