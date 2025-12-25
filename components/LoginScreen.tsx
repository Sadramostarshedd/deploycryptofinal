
import React, { useState } from 'react';
import { 
  Button, 
  Input, 
  Card, 
  CardBody, 
  Tabs, 
  Tab, 
  useDisclosure,
  Checkbox,
  Link,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter
} from '@heroui/react';
import { ShieldCheck, AlertCircle, Cpu, Lock, User, Globe, FileText, Info, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase.ts';

interface LoginScreenProps {
  onLogin: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState<any>("login");
  const [isVisible, setIsVisible] = useState(false);
  
  const toggleVisibility = () => setIsVisible(!isVisible);

  // Disclosure for the Manual Override / Info Modal
  const { isOpen: isOverrideOpen, onOpen: onOverrideOpen, onOpenChange: onOverrideOpenChange } = useDisclosure();
  // Disclosure specifically for the Terms of Engagement Modal
  const { isOpen: isTermsOpen, onOpen: onTermsOpen, onOpenChange: onTermsOpenChange } = useDisclosure();

  const handleTabChange = (key: any) => {
    setSelectedTab(key);
    setError(null);
    setTermsAccepted(false); 
    setIsVisible(false); // Reset visibility on tab change
  };

  const handleAuth = async (type: 'login' | 'signup') => {
    if (!termsAccepted) return;
    setError(null);
    setLoading(true);

    if (password.length < 6) {
      setError("SEC_ERR: MIN_KEY_6_CHARS");
      setLoading(false);
      return;
    }

    try {
      if (type === 'signup') {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username: username || email.split('@')[0] }
          }
        });

        if (signUpError) {
          if (signUpError.message.toLowerCase().includes('already registered')) {
            setError("AUTH_ERR: IDENTITY_EXISTS");
          } else {
            throw signUpError;
          }
          setLoading(false);
          return;
        }

        const userId = signUpData?.user?.id;
        if (userId) {
          await supabase.from('profiles').upsert({
            id: userId,
            username: username || email.split('@')[0],
            wins: 0,
            losses: 0,
            total_score: 0
          });
        }
        onLogin();
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        onLogin();
      }
    } catch (err: any) {
      setError(err.message?.toUpperCase().replace(/\s/g, '_') || 'CORE_SYSTEM_FAILURE');
    } finally {
      setLoading(false);
    }
  };

  const inputStyles = {
    label: "text-[10px] font-black text-slate-500 tracking-[0.2em] uppercase mb-1",
    input: "text-white font-mono text-sm placeholder:text-slate-700",
    inputWrapper: [
      "bg-slate-900/50",
      "border-1",
      "border-slate-800",
      "rounded-none",
      "transition-all",
      "h-12",
      "group-data-[focus=true]:border-primary",
      "group-data-[focus=true]:bg-black",
      "after:hidden",
      "before:hidden"
    ].join(" ")
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full overflow-hidden bg-[#020617] cyber-grid relative px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[10%] left-[5%] text-[8px] font-mono text-primary/40 leading-none">
          {Array.from({length: 10}).map((_, i) => <div key={i}>0x{Math.random().toString(16).slice(2, 10).toUpperCase()} >> SYNCING_NODE_{i}</div>)}
        </div>
        <div className="absolute bottom-[10%] right-[5%] text-[8px] font-mono text-primary/40 text-right leading-none">
          {Array.from({length: 10}).map((_, i) => <div key={i}>BATTLE_LOG_STREAM :: SESSION_INIT_{i}</div>)}
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[440px] z-10 flex flex-col items-center"
      >
        <div className="flex flex-col gap-1 mb-6 items-center text-center">
          <div className="flex items-center gap-2 text-primary">
            <Cpu size={14} className="animate-pulse" />
            <span className="text-[10px] font-black tracking-[0.5em] uppercase opacity-70">Combat Terminal v3.4</span>
          </div>
          {/* Header container - blue border removed per request */}
          <div className="mt-4 mb-2">
            <h1 className="text-6xl font-black text-white italic tracking-tighter leading-none uppercase">
              CRYPTO <span className="text-primary">ARENA</span>
            </h1>
          </div>
        </div>

        <Card className="w-full bg-black/60 border border-slate-800 rounded-none backdrop-blur-xl shadow-2xl overflow-visible">
          <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-primary" />
          <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-primary" />
          <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-primary" />
          <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-primary" />

          <CardBody className="p-8 overflow-hidden">
            <Tabs 
              fullWidth 
              variant="solid" 
              selectedKey={selectedTab}
              onSelectionChange={handleTabChange}
              classNames={{
                tabList: "bg-slate-900/40 p-1 rounded-none border border-slate-800",
                tab: "h-10 font-black text-[11px] tracking-[0.2em] uppercase rounded-none transition-all",
                cursor: "bg-primary rounded-none shadow-[0_0_10px_rgba(0,255,65,0.3)]",
                tabContent: "group-data-[selected=true]:text-black text-slate-500",
                panel: "pt-8"
              }}
            >
              <Tab key="login" title="LOGIN">
                <form className="flex flex-col gap-6" onSubmit={(e) => { e.preventDefault(); handleAuth('login'); }}>
                  <div className="flex flex-col gap-4">
                    <Input
                      label="EMAIL"
                      value={email}
                      onValueChange={setEmail}
                      labelPlacement="outside"
                      placeholder="USER@DOMAIN.SYS"
                      classNames={inputStyles}
                      startContent={<Globe size={16} className="text-slate-600 mr-2" />}
                    />
                    <div className="mt-[5px]">
                      <Input
                        label="PASSWORD"
                        type={isVisible ? "text" : "password"}
                        value={password}
                        onValueChange={setPassword}
                        labelPlacement="outside"
                        placeholder="••••••••••••"
                        classNames={inputStyles}
                        startContent={<Lock size={16} className="text-slate-600 mr-2" />}
                        endContent={
                          <button className="focus:outline-none" type="button" onClick={toggleVisibility} aria-label="toggle password visibility">
                            {isVisible ? (
                              <EyeOff size={18} className="text-slate-500 hover:text-primary transition-colors" />
                            ) : (
                              <Eye size={18} className="text-slate-500 hover:text-primary transition-colors" />
                            )}
                          </button>
                        }
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-6 mt-4">
                    <Checkbox 
                      isSelected={termsAccepted} 
                      onValueChange={setTermsAccepted}
                      color="success"
                      classNames={{
                        label: "text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight",
                        wrapper: "before:border-slate-800 rounded-none after:rounded-none"
                      }}
                    >
                      I ACCEPT THE <Link onPress={onTermsOpen} className="text-[10px] text-primary font-black underline cursor-pointer">TERMS_OF_ENGAGEMENT</Link>
                    </Checkbox>

                    <AnimatePresence>
                      {error && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20"
                        >
                          <AlertCircle size={14} className="text-red-500" />
                          <span className="text-[9px] font-black text-red-500 uppercase tracking-wider">{error}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <Button
                      type="submit"
                      isDisabled={!termsAccepted || loading}
                      isLoading={loading}
                      className={`h-14 font-black text-lg tracking-[0.4em] uppercase rounded-none transition-all ${
                        termsAccepted 
                        ? 'bg-primary text-black shadow-[0_0_20px_rgba(0,255,65,0.3)] hover:bg-white hover:shadow-[0_0_30px_rgba(255,255,255,0.4)]' 
                        : 'bg-slate-900 text-slate-700 cursor-not-allowed border border-slate-800'
                      }`}
                    >
                      {loading ? 'SYNCING...' : 'START THE GAME'}
                    </Button>
                  </div>
                </form>
              </Tab>

              <Tab key="signup" title="NEW PLAYER">
                <form className="flex flex-col gap-6" onSubmit={(e) => { e.preventDefault(); handleAuth('signup'); }}>
                  <div className="flex flex-col gap-4">
                    <Input
                      label="EMAIL"
                      value={email}
                      onValueChange={setEmail}
                      labelPlacement="outside"
                      placeholder="OPERATOR@DOMAIN.SYS"
                      classNames={inputStyles}
                    />
                    <Input
                      label="SQUAD_CALLSIGN"
                      value={username}
                      onValueChange={setUsername}
                      labelPlacement="outside"
                      placeholder="NICKNAME_X"
                      classNames={inputStyles}
                      startContent={<User size={16} className="text-slate-600 mr-2" />}
                    />
                    <div className="mt-[5px]">
                      <Input
                        label="PASSWORD"
                        type={isVisible ? "text" : "password"}
                        value={password}
                        onValueChange={setPassword}
                        labelPlacement="outside"
                        placeholder="MIN_6_CHARACTERS"
                        classNames={inputStyles}
                        endContent={
                          <button className="focus:outline-none" type="button" onClick={toggleVisibility} aria-label="toggle password visibility">
                            {isVisible ? (
                              <EyeOff size={18} className="text-slate-500 hover:text-primary transition-colors" />
                            ) : (
                              <Eye size={18} className="text-slate-500 hover:text-primary transition-colors" />
                            )}
                          </button>
                        }
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-6 mt-4">
                    <Checkbox 
                      isSelected={termsAccepted} 
                      onValueChange={setTermsAccepted}
                      color="success"
                      classNames={{
                        label: "text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight",
                        wrapper: "before:border-slate-800 rounded-none after:rounded-none"
                      }}
                    >
                      ACKNOWLEDGE <Link onPress={onTermsOpen} className="text-[10px] text-primary font-black underline cursor-pointer">ARENA_PROTOCOL_B1</Link>
                    </Checkbox>

                    <AnimatePresence>
                      {error && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20"
                        >
                          <AlertCircle size={14} className="text-red-500" />
                          <span className="text-[9px] font-black text-red-500 uppercase tracking-wider">{error}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <Button
                      type="submit"
                      isDisabled={!termsAccepted || loading}
                      isLoading={loading}
                      className={`h-14 font-black text-lg tracking-[0.4em] uppercase rounded-none transition-all ${
                        termsAccepted 
                        ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:bg-primary' 
                        : 'bg-slate-900 text-slate-700 cursor-not-allowed border border-slate-800'
                      }`}
                    >
                      {loading ? 'PROCESSING...' : 'START THE GAME'}
                    </Button>
                  </div>
                </form>
              </Tab>
            </Tabs>
          </CardBody>
        </Card>

        <div className="mt-8 flex justify-between items-center opacity-40 px-2 w-full">
          <div className="flex items-center gap-2">
            <ShieldCheck size={12} className="text-primary" />
            <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">AES-256 Link Active</span>
          </div>
          <button 
            onClick={onOverrideOpen}
            className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-primary transition-colors"
          >
            [ Manual_Override ]
          </button>
        </div>
      </motion.div>

      {/* TERMS OF ENGAGEMENT MODAL */}
      <Modal 
        isOpen={isTermsOpen} 
        onOpenChange={onTermsOpenChange}
        className="dark text-foreground bg-slate-950 border-2 border-slate-800"
        backdrop="blur"
        size="lg"
        scrollBehavior="inside"
      >
        <ModalContent className="rounded-none">
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 border-b border-slate-800">
                <div className="flex items-center gap-2 text-primary">
                  <FileText size={18} />
                  <span className="font-black text-sm uppercase tracking-widest italic">Arena Protocol Briefing</span>
                </div>
              </ModalHeader>
              <ModalBody className="py-6 font-mono text-[12px] text-slate-300 leading-relaxed">
                <div className="space-y-6">
                  <section>
                    <h4 className="text-primary font-bold uppercase mb-2">Protocol 01: Volatility Awareness</h4>
                    <p>All operators must acknowledge that the Bitcoin network operates in a state of high entropy. Price movements are tracked via Coinbase/Binance nodes. Prediction accuracy is influenced by global sentiment delta.</p>
                  </section>
                  
                  <section>
                    <h4 className="text-primary font-bold uppercase mb-2">Protocol 02: Squad Accountability</h4>
                    <p>By joining ALPHA or BETA, you assume collective responsibility for territory control. Rewards and ranks are distributed based on combat win-rate and persistent conviction score.</p>
                  </section>

                  <section>
                    <h4 className="text-primary font-bold uppercase mb-2">Protocol 03: System Latency</h4>
                    <p>Network lag and node desync are tactical risks. In the event of a total network severance, the Arena reserves the right to revert to the last stable state recorded in the Supabase ledger.</p>
                  </section>

                  <section>
                    <h4 className="text-primary font-bold uppercase mb-2">Protocol 04: Data Integrity</h4>
                    <p>Unauthorized manipulation of uplink packets or bot-mimicry will result in immediate identity purge and permanent blacklist from Crypto Arena.</p>
                  </section>

                  <div className="p-4 bg-red-950/20 border border-red-900/50 flex gap-4 items-start">
                    <AlertCircle size={24} className="text-red-500 shrink-0" />
                    <div>
                      <p className="text-red-500 font-black uppercase mb-1">Warning</p>
                      <p className="text-[10px] text-slate-400">By proceeding, you verify your neural link is stable and you accept all consequences of high-frequency tactical speculation.</p>
                    </div>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter className="border-t border-slate-800">
                <Button 
                  onPress={onClose} 
                  className="bg-primary text-black font-black uppercase tracking-widest rounded-none"
                >
                  Acknowledge_Directive
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* MANUAL OVERRIDE / INFO MODAL */}
      <Modal 
        isOpen={isOverrideOpen} 
        onOpenChange={onOverrideOpenChange}
        className="dark text-foreground bg-slate-950 border border-slate-800"
        backdrop="blur"
      >
        <ModalContent className="rounded-none">
          {(onClose) => (
            <>
              <ModalHeader className="flex items-center gap-2">
                <Info size={16} className="text-primary" />
                <span className="font-black text-xs uppercase tracking-[0.3em]">System Manifest</span>
              </ModalHeader>
              <ModalBody className="pb-8">
                <div className="space-y-4">
                  <div className="bg-slate-900/50 p-4 border border-slate-800">
                    <p className="text-[10px] text-slate-500 uppercase font-black mb-2">Build Identifier</p>
                    <p className="font-mono text-white text-xs">ARENA_ONE_PROD_V3.4.192</p>
                  </div>
                  <div className="bg-slate-900/50 p-4 border border-slate-800">
                    <p className="text-[10px] text-slate-500 uppercase font-black mb-2">Encryption Status</p>
                    <p className="font-mono text-green-500 text-xs">SUPABASE_SECURE_AUTH :: ACTIVE</p>
                  </div>
                  <p className="text-[10px] text-slate-400 text-center uppercase tracking-widest mt-4">
                    Contact sector command if uplink fails.
                  </p>
                </div>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};

export default LoginScreen;
