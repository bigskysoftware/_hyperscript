plugins {
    id("java")
    id("org.jetbrains.kotlin.jvm") version "2.1.10"
    id("org.jetbrains.intellij.platform") version "2.2.1"
}

group = "org.hyperscript"
version = "0.1.0"

java {
    sourceCompatibility = JavaVersion.VERSION_21
    targetCompatibility = JavaVersion.VERSION_21
}

kotlin {
    jvmToolchain(21)
}

repositories {
    mavenCentral()
    intellijPlatform {
        defaultRepositories()
    }
}

dependencies {
    intellijPlatform {
        intellijIdeaCommunity("2024.3")
    }
    implementation("org.graalvm.polyglot:polyglot:24.1.1")
    implementation("org.graalvm.polyglot:js:24.1.1")
    testImplementation("junit:junit:4.13.2")
}

intellijPlatform {
    pluginConfiguration {
        id = "org.hyperscript.jetbrains"
        name = "Hyperscript"
        version = project.version.toString()
        ideaVersion {
            sinceBuild = "243"
        }
    }
}

tasks {
    // Copy the IIFE from tools/common into plugin resources before build
    val copyCommon by registering(Copy::class) {
        from("../common")
        into("src/main/resources/hyperscript")
    }

    processResources {
        dependsOn(copyCommon)
    }
}
