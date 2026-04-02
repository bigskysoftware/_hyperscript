# Hyperscript Tools

This is a directory for tools related to the hyperscript langauge:

* VSCode plugin
* Jetbrains plugin
* LSP

Unlike the core codebase, this codebase allows aggressive vibe coding because maintaining tools is a difficult and
thankless task, with each vendor having its own specialized APIs

## Overall Architecture

That said, all tools should follow a common pattern:

* Each tool should use the hyperscript javascript parser(s) itself to parse code
  * e.g. for the JetBrains plugin we use GraalVM to host the parser
* Common functionality should be hosted in the `/common` directory
  * As much as possible, code should be shared across tools in this directory
* Generally the simplest possible approach should be used, only use complicated solutions if absolutely necessary
* The tools should embed a version of the IIFE version of hyperscript to use in the host javascript implementation
* Every tool should support a .hsrc file in the root of the project directory that allows a user to point at a different
  implementation of hyperscript than the one embedded in the tool.   This should work without issue.
* Tools should be designed for maximum compatibility and not use the latest and greatest APIs if that means only some people can use them
