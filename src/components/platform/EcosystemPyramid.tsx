// Importyour pyramid image here and replace the src below
// Example: import pyramidImage from "@/assets/pyramid.png";
import pyramidImage from "@/assets/pyramid.png"; 
const EcosystemPyramid = () => {
  return (
    <section className="w-full bg-[#0a1628] py-4 md:py-6 lg:py-8">
      <div className="w-full px-2 sm:px-4 md:px-6">
        <img 
          src={pyramidImage} 
          alt="Shelf Merch Platform Ecosystem Pyramid"
          className="w-full h-auto object-contain"
        />
      </div>
    </section>
  );
};

export default EcosystemPyramid;