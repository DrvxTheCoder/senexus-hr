-- CreateTable
CREATE TABLE "modules" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "version" TEXT NOT NULL,
    "icon" TEXT,
    "basePath" TEXT NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "firm_modules" (
    "id" TEXT NOT NULL,
    "firmId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "settings" JSONB,
    "installedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "installedBy" TEXT,

    CONSTRAINT "firm_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "module_dependencies" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "dependsOnId" TEXT NOT NULL,

    CONSTRAINT "module_dependencies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "modules_slug_key" ON "modules"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "firm_modules_firmId_moduleId_key" ON "firm_modules"("firmId", "moduleId");

-- CreateIndex
CREATE UNIQUE INDEX "module_dependencies_moduleId_dependsOnId_key" ON "module_dependencies"("moduleId", "dependsOnId");

-- AddForeignKey
ALTER TABLE "firm_modules" ADD CONSTRAINT "firm_modules_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "firms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "firm_modules" ADD CONSTRAINT "firm_modules_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_dependencies" ADD CONSTRAINT "module_dependencies_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_dependencies" ADD CONSTRAINT "module_dependencies_dependsOnId_fkey" FOREIGN KEY ("dependsOnId") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
