# Product Overview

Open Banking MCP Server — an MCP (Model Context Protocol) server that exposes UK Open Banking Account and Transaction API operations as tools for AI assistants.

## Purpose

Provides AI agents with structured access to Open Banking APIs (v4.0.1) including:
- Account listing and details
- Account balances
- Account products
- Account transactions

## Domain

UK Open Banking standard (openbanking.org.uk). The server acts as a bridge between AI/LLM clients and Open Banking-compliant financial institutions.

## API Specification

The project includes the full OpenAPI 3.0 spec at `src/main/resources/openbanking-spec.json`. This is the authoritative reference for request/response schemas, parameters, and endpoint behavior.
