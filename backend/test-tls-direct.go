package main

import (
	"crypto/tls"
	"crypto/x509"
	"fmt"
	_ "log"
	"net"
	"time"
)

func main() {
	hosts := []string{
		"cluster-petamini-shard-00-00.brepo4.mongodb.net:27017",
		"cluster-petamini-shard-00-01.brepo4.mongodb.net:27017",
		"cluster-petamini-shard-00-02.brepo4.mongodb.net:27017",
	}

	fmt.Println("🔐 Testing direct TLS connection to MongoDB Atlas hosts...")
	fmt.Println()

	for i, host := range hosts {
		fmt.Printf("Test %d: %s\n", i+1, host)
		testTLSConnection(host)
		fmt.Println()
	}
}

func testTLSConnection(host string) {
	// First test basic TCP connection
	fmt.Println("  ⏱️  Testing TCP connection...")
	conn, err := net.DialTimeout("tcp", host, 10*time.Second)
	if err != nil {
		fmt.Printf("  ❌ TCP connection failed: %v\n", err)
		return
	}
	fmt.Println("  ✅ TCP connection successful")
	conn.Close()

	// Test TLS connection with system cert pool
	fmt.Println("  🔒 Testing TLS handshake with system certs...")
	
	systemCertPool, err := x509.SystemCertPool()
	if err != nil {
		fmt.Printf("  ⚠️  Warning: Could not load system cert pool: %v\n", err)
		systemCertPool = x509.NewCertPool()
	}

	tlsConfig := &tls.Config{
		RootCAs:    systemCertPool,
		ServerName: host[:len(host)-6], // Remove :27017
		MinVersion: tls.VersionTLS12,
		MaxVersion: tls.VersionTLS13,
	}

	dialer := &net.Dialer{
		Timeout: 10 * time.Second,
	}

	tlsConn, err := tls.DialWithDialer(dialer, "tcp", host, tlsConfig)
	if err != nil {
		fmt.Printf("  ❌ TLS handshake failed: %v\n", err)
		
		// Try with TLS 1.2 only
		fmt.Println("  🔄 Retrying with TLS 1.2 only...")
		tlsConfig.MaxVersion = tls.VersionTLS12
		tlsConn, err = tls.DialWithDialer(dialer, "tcp", host, tlsConfig)
		if err != nil {
			fmt.Printf("  ❌ TLS 1.2 also failed: %v\n", err)
			
			// Try with InsecureSkipVerify
			fmt.Println("  🔄 Retrying with InsecureSkipVerify...")
			tlsConfig.InsecureSkipVerify = true
			tlsConn, err = tls.DialWithDialer(dialer, "tcp", host, tlsConfig)
			if err != nil {
				fmt.Printf("  ❌ Even InsecureSkipVerify failed: %v\n", err)
				return
			}
		}
	}
	defer tlsConn.Close()

	// Get connection state
	state := tlsConn.ConnectionState()
	fmt.Println("  ✅ TLS handshake successful!")
	fmt.Printf("  📋 TLS Version: %s\n", tlsVersionString(state.Version))
	fmt.Printf("  📋 Cipher Suite: %s\n", tls.CipherSuiteName(state.CipherSuite))
	fmt.Printf("  📋 Server Name: %s\n", state.ServerName)
	
	if len(state.PeerCertificates) > 0 {
		cert := state.PeerCertificates[0]
		fmt.Printf("  📋 Certificate Subject: %s\n", cert.Subject)
		fmt.Printf("  📋 Certificate Issuer: %s\n", cert.Issuer)
		fmt.Printf("  📋 Valid Until: %s\n", cert.NotAfter.Format("2006-01-02"))
	}
}

func tlsVersionString(version uint16) string {
	switch version {
	case tls.VersionTLS10:
		return "TLS 1.0"
	case tls.VersionTLS11:
		return "TLS 1.1"
	case tls.VersionTLS12:
		return "TLS 1.2"
	case tls.VersionTLS13:
		return "TLS 1.3"
	default:
		return fmt.Sprintf("Unknown (0x%04X)", version)
	}
}
