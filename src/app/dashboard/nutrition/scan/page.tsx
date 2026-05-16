import { FoodScanUploader } from "@/components/nutrition/FoodScanUploader";
import { KbjuManualCalculator } from "@/components/nutrition/KbjuManualCalculator";
import { KbjuProductsCalculator } from "@/components/nutrition/KbjuProductsCalculator";
import { NutritionScanHero } from "@/components/nutrition/NutritionScanHero";

export default function NutritionScanPage() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6 sm:px-6">
      <NutritionScanHero />
      <KbjuProductsCalculator />
      <KbjuManualCalculator />
      <FoodScanUploader />
    </div>
  );
}
