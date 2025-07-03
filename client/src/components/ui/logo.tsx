import logoImage from '../../assets/echoes-logo.png';

export default function Logo() {
  return (
    <div className="relative flex justify-center items-center">
      {/* Main logo with glow effect */}
      <img 
        src={logoImage} 
        alt="Echoes of the Void" 
        className="w-full max-w-[400px] sm:max-w-[500px] md:max-w-[600px] lg:max-w-[700px] xl:max-w-[800px] h-auto" 
        style={{ 
          position: 'relative',
          zIndex: 2,

        }}
      />
    </div>
  );
} 